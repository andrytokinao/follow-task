package com.kinga.tasksservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kinga.followtask.dto.ApercuImportAnnuaire.Verdict;
import com.kinga.followtask.dto.DemandeImportAnnuaire;
import com.kinga.followtask.dto.RapportImportUsers;
import com.kinga.followtask.dto.RapportImportUsers.Statut;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.UserRepository;
import com.kinga.followtask.service.UserImportService;
import com.kinga.followtask.service.UserService;
import com.kinga.followtask.service.annuaire.ImportAnnuaireService;
import com.kinga.followtask.service.annuaire.ProfilExterne;
import com.kinga.followtask.service.annuaire.SourceAnnuaire;
import com.kinga.followtask.service.annuaire.SourcesAnnuaire;
import com.kinga.followtask.service.annuaire.StaffTheBestSource;
import com.kinga.followtask.service.annuaire.doublon.DetecteurDoublons;
import com.kinga.followtask.service.annuaire.doublon.DoublonParCin;
import com.kinga.followtask.service.annuaire.doublon.DoublonParContact;
import com.kinga.followtask.service.annuaire.doublon.DoublonParEmail;
import com.kinga.followtask.service.annuaire.doublon.DoublonParNom;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Import depuis un annuaire : reconnaissance des adresses, et surtout le sort
 * fait aux personnes qui ont déjà un compte.
 */
class ImportAnnuaireTest {

    private static final String RACINE = "http://si.thebest.mg/staff/api/admin/personnels/";
    private static final String ID = "76a65eeb-bcb0-4e3b-bc76-4ce7f006635b";

    private final UserRepository userRepository = mock(UserRepository.class);
    private final UserService userService = mock(UserService.class);
    private final UserImportService userImportService = mock(UserImportService.class);

    /** Fiches servies par la fausse source, par référence. */
    private final Map<String, ProfilExterne> fiches = new HashMap<>();

    private ImportAnnuaireService service;

    @BeforeEach
    void preparer() {
        SourceAnnuaire source = new SourceAnnuaire() {
            public String code() {
                return "test";
            }

            public boolean prendEnCharge(String reference) {
                return true;
            }

            public ProfilExterne lire(String reference) throws IOException {
                ProfilExterne profil = fiches.get(reference);
                if (profil == null) {
                    throw new IOException("Réponse HTTP 404");
                }
                return profil;
            }
        };
        DetecteurDoublons detecteur = new DetecteurDoublons(List.of(
                new DoublonParEmail(userRepository), new DoublonParContact(userRepository),
                new DoublonParCin(userRepository), new DoublonParNom(userRepository)));
        service = new ImportAnnuaireService(new SourcesAnnuaire(List.of(source)), detecteur,
                userService, userImportService);

        when(userRepository.findByLastNameIgnoreCase(anyString())).thenReturn(List.of());
        when(userService.save(any(UserApp.class))).thenAnswer(invocation -> {
            UserApp compte = invocation.getArgument(0);
            compte.setId("id");
            compte.setUsername("sully.m");
            return compte;
        });
    }

    private static ProfilExterne sully() {
        return new ProfilExterne("test", ID, "Sully", "Manamid", "sullymanamid@gmail.com",
                "0328915767", "715051029339", "67Ha Ankasina", "Ingénieur d'étude", null);
    }

    private static UserApp compte(String username, String nom, String prenom) {
        UserApp compte = new UserApp();
        compte.setId("id-" + username);
        compte.setUsername(username);
        compte.setLastName(nom);
        compte.setFirstName(prenom);
        return compte;
    }

    private RapportImportUsers importer(List<String> confirmees, String... references) {
        return service.importer(new DemandeImportAnnuaire(List.of(references), confirmees, "Defaut2026"));
    }

    // -----------------------------------------------------------------
    // Adresses de l'annuaire du personnel
    // -----------------------------------------------------------------

    @Test
    void reconnaitLAdresseCompleteLIdentifiantSeulEtLeHttps() {
        StaffTheBestSource staff = new StaffTheBestSource(RACINE, new ObjectMapper());

        assertThat(staff.prendEnCharge(RACINE + ID)).isTrue();
        assertThat(staff.prendEnCharge(RACINE.replace("http:", "https:") + ID + "/")).isTrue();
        assertThat(staff.prendEnCharge(ID)).isTrue();
    }

    @Test
    void refuseUnAutreHoteEtUneRemonteeDeChemin() {
        StaffTheBestSource staff = new StaffTheBestSource(RACINE, new ObjectMapper());

        assertThat(staff.prendEnCharge("http://ailleurs.mg/personnels/" + ID)).isFalse();
        assertThat(staff.prendEnCharge(RACINE + "../../secret")).isFalse();
        assertThat(staff.prendEnCharge("")).isFalse();
    }

    // -----------------------------------------------------------------
    // Doublons
    // -----------------------------------------------------------------

    @Test
    void personneInconnueEstCreeeAvecLeMotDePasseParDefaut() {
        fiches.put(ID, sully());

        assertThat(service.apercu(List.of(ID)).get(0).verdict()).isEqualTo(Verdict.NOUVEAU);
        RapportImportUsers rapport = importer(List.of(), ID);

        assertThat(rapport.crees()).isEqualTo(1);
        verify(userService).save(any(UserApp.class));
    }

    @Test
    void memeEmailEstIgnoreSansConfirmationPossible() {
        fiches.put(ID, sully());
        when(userRepository.findByEmail("sullymanamid@gmail.com")).thenReturn(compte("sully", "Sully", "M"));

        assertThat(service.apercu(List.of(ID)).get(0).verdict()).isEqualTo(Verdict.DEJA_PRESENT);
        // Même confirmé, un doublon certain n'est pas recréé.
        RapportImportUsers rapport = importer(List.of(ID), ID);

        assertThat(rapport.ignores()).isEqualTo(1);
        assertThat(rapport.lignes().get(0).statut()).isEqualTo(Statut.IGNORE);
        assertThat(rapport.lignes().get(0).message()).contains("même email");
        verify(userService, never()).save(any());
    }

    @Test
    void memeTelephoneEstIgnoreMemeSaisiAvecDesEspaces() {
        ProfilExterne p = sully();
        fiches.put(ID, new ProfilExterne("test", ID, p.nom(), p.prenoms(), null, "032 89 157 67",
                null, null, null, null));
        when(userRepository.findByContact("0328915767")).thenReturn(compte("sully", "X", "Y"));

        assertThat(service.apercu(List.of(ID)).get(0).verdict()).isEqualTo(Verdict.DEJA_PRESENT);
    }

    @Test
    void homonymeDemandeConfirmationPuisEstCreeSiConfirme() {
        fiches.put(ID, sully());
        // Casse et accent différents, nom et prénom inversés : c'est bien un homonyme.
        when(userRepository.findByLastNameIgnoreCase("Manamid")).thenReturn(List.of(compte("autre", "MANAMID", "Sülly")));

        assertThat(service.apercu(List.of(ID)).get(0).verdict()).isEqualTo(Verdict.A_CONFIRMER);

        assertThat(importer(List.of(), ID).ignores()).isEqualTo(1);
        verify(userService, never()).save(any());

        assertThat(importer(List.of(ID), ID).crees()).isEqualTo(1);
    }

    // -----------------------------------------------------------------
    // Isolement des fiches
    // -----------------------------------------------------------------

    @Test
    void uneFicheIllisibleNEmpechePasLesAutres() {
        fiches.put(ID, sully());

        RapportImportUsers rapport = importer(List.of(), "inconnue-0000", ID, ID);

        // La référence répétée n'est traitée qu'une fois.
        assertThat(rapport.total()).isEqualTo(2);
        assertThat(rapport.rejetes()).isEqualTo(1);
        assertThat(rapport.crees()).isEqualTo(1);
        assertThat(rapport.lignes().get(0).message()).contains("404");
    }

    @Test
    void sansMotDePasseParDefautRienNEstTente() {
        fiches.put(ID, sully());

        assertThatThrownBy(() -> service.importer(new DemandeImportAnnuaire(List.of(ID), List.of(), " ")))
                .isInstanceOf(IllegalArgumentException.class);
        verify(userService, never()).save(any());
    }
}
