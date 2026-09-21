package com.kinga.tasksservice.service;

import com.kinga.followtask.config.ConfigSystem;
import com.kinga.followtask.dto.RapportImportUsers;
import com.kinga.followtask.dto.RapportImportUsers.LigneImport;
import com.kinga.followtask.dto.RapportImportUsers.Statut;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.UserRepository;
import com.kinga.followtask.service.UserImportService;
import com.kinga.followtask.service.UserService;
import com.kinga.utils.ExcelUtils;
import com.kinga.utils.KingaUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Import d'utilisateurs par tableur.
 *
 * <p>Ce qui est vérifié ici n'est pas la mécanique Excel — {@code ExcelUtils} a
 * la sienne — mais les trois endroits où un import se casse en vrai :</p>
 *
 * <ul>
 *   <li>le zéro initial d'un numéro, mangé par Excel dès que la colonne n'est
 *       pas au format texte ;</li>
 *   <li>les intitulés de colonnes, qu'un tableur rempli à la main n'écrit
 *       jamais exactement comme la documentation ;</li>
 *   <li>l'isolement des lignes : une ligne fautive ne doit pas emporter les
 *       autres, et une photo injoignable ne doit pas empêcher la création du
 *       compte.</li>
 * </ul>
 */
class ImportUtilisateursTest {

    private static final List<String> COLONNES =
            List.of("username", "email", "Nom", "Prenom", "cin", "contact", "password", "urlPhoto");

    /** Une adresse dont on sait qu'elle échouera sans toucher au réseau. */
    private static final String URL_IMPOSSIBLE = "ftp://serveur/photo.jpg";

    private final UserService userService = mock(UserService.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final ConfigSystem configSystem = mock(ConfigSystem.class);

    private UserImportService importService;

    @TempDir
    Path dossierPhotos;

    @BeforeEach
    void preparer() {
        importService = new UserImportService(userService, userRepository, configSystem);
        when(configSystem.getProfileDirectories()).thenReturn(dossierPhotos.toString());
        // Par défaut, l'enregistrement réussit et rend le compte tel quel.
        when(userService.save(any(UserApp.class))).thenAnswer(invocation -> {
            UserApp compte = invocation.getArgument(0);
            compte.setId("id-" + compte.getUsername());
            return compte;
        });
    }

    // -----------------------------------------------------------------
    // Lecture des cellules
    // -----------------------------------------------------------------

    @Test
    void retablit_le_zero_initial_mange_par_excel() throws IOException {
        // Un numéro saisi sans mettre la colonne en texte : Excel n'en garde
        // qu'un nombre, le 0 de tête a disparu.
        Map<String, Object> ligne = ligneValide();
        ligne.put("contact", 341234567L);

        importService.importer(classeur(ligne));

        assertThat(compteEnregistre().getContact()).isEqualTo("0341234567");
    }

    @Test
    void garde_un_numero_deja_correct() throws IOException {
        Map<String, Object> ligne = ligneValide();
        ligne.put("contact", "0341234567");

        importService.importer(classeur(ligne));

        assertThat(compteEnregistre().getContact()).isEqualTo("0341234567");
    }

    @Test
    void lit_un_cin_numerique_sans_notation_scientifique() throws IOException {
        Map<String, Object> ligne = ligneValide();
        ligne.put("cin", 101234567890L);

        importService.importer(classeur(ligne));

        assertThat(compteEnregistre().getCin()).isEqualTo("101234567890");
    }

    @Test
    void accepte_les_intitules_accentues_et_les_alias_anglais() throws IOException {
        Map<String, Integer> entetes = new LinkedHashMap<>();
        entetes.put("Login", 0);
        entetes.put("E-Mail", 1);
        entetes.put("lastName", 2);
        entetes.put("PRÉNOM", 3);
        entetes.put("Mot de passe", 4);
        entetes.put("Téléphone", 5);

        Map<String, Object> ligne = new LinkedHashMap<>();
        ligne.put("Login", "rakoto.j");
        ligne.put("E-Mail", "jean@exemple.mg");
        ligne.put("lastName", "RAKOTO");
        ligne.put("PRÉNOM", "Jean");
        ligne.put("Mot de passe", "Secret2026");
        ligne.put("Téléphone", "0341234567");

        importService.importer(classeur(entetes, List.of(ligne)));

        UserApp compte = compteEnregistre();
        assertThat(compte.getUsername()).isEqualTo("rakoto.j");
        assertThat(compte.getEmail()).isEqualTo("jean@exemple.mg");
        assertThat(compte.getLastName()).isEqualTo("RAKOTO");
        assertThat(compte.getFirstName()).isEqualTo("Jean");
        assertThat(compte.getPassword()).isEqualTo("Secret2026");
        assertThat(compte.getContact()).isEqualTo("0341234567");
    }

    // -----------------------------------------------------------------
    // Isolement des lignes
    // -----------------------------------------------------------------

    @Test
    void une_ligne_fautive_n_emporte_pas_les_autres() throws IOException {
        Map<String, Object> premiere = ligneValide();
        premiere.put("username", "bon1");
        Map<String, Object> fautive = ligneValide();
        fautive.put("username", "mauvais");
        Map<String, Object> derniere = ligneValide();
        derniere.put("username", "bon2");

        when(userService.save(any(UserApp.class))).thenAnswer(invocation -> {
            UserApp compte = invocation.getArgument(0);
            if ("mauvais".equals(compte.getUsername())) {
                throw new RuntimeException("Contact 0341234567 is alredy in used");
            }
            return compte;
        });

        RapportImportUsers rapport =
                importService.importer(classeur(List.of(premiere, fautive, derniere)));

        assertThat(rapport.total()).isEqualTo(3);
        assertThat(rapport.crees()).isEqualTo(2);
        assertThat(rapport.rejetes()).isEqualTo(1);

        LigneImport rejet = rapport.lignes().get(1);
        assertThat(rejet.statut()).isEqualTo(Statut.REJETE);
        // La ligne 1 porte l'en-tête : la deuxième ligne de données est la 3.
        assertThat(rejet.ligne()).isEqualTo(3);
        assertThat(rejet.message()).contains("is alredy in used");
    }

    @Test
    void une_photo_injoignable_ne_bloque_pas_la_creation() throws IOException {
        Map<String, Object> ligne = ligneValide();
        ligne.put("urlPhoto", URL_IMPOSSIBLE);

        RapportImportUsers rapport = importService.importer(classeur(ligne));

        assertThat(rapport.crees()).isEqualTo(1);
        assertThat(rapport.rejetes()).isZero();
        assertThat(rapport.lignes().get(0).statut()).isEqualTo(Statut.CREE_SANS_PHOTO);
        assertThat(rapport.lignes().get(0).message()).contains("Photo non récupérée");
    }

    // -----------------------------------------------------------------
    // Photo
    // -----------------------------------------------------------------

    @Test
    void reutilise_une_photo_deja_presente_sans_rien_telecharger() throws IOException {
        // Le fichier existe déjà sous le nom attendu : l'import doit s'en
        // contenter. L'adresse fournie est volontairement inutilisable — si
        // elle était sollicitée, la ligne repasserait en CREE_SANS_PHOTO.
        Path existante = dossierPhotos.resolve("rakoto.j.jpg");
        Files.write(existante, new byte[]{1, 2, 3});

        Map<String, Object> ligne = ligneValide();
        ligne.put("username", "rakoto.j");
        ligne.put("urlPhoto", URL_IMPOSSIBLE);

        RapportImportUsers rapport = importService.importer(classeur(ligne));

        assertThat(rapport.lignes().get(0).statut()).isEqualTo(Statut.CREE);
        assertThat(KingaUtils.decodeText(compteEnregistre().getPhoto()))
                .isEqualTo(existante.toString());
        // Le contenu n'a pas été remplacé.
        assertThat(Files.readAllBytes(existante)).containsExactly(1, 2, 3);
    }

    @Test
    void sans_url_de_photo_aucun_fichier_n_est_ecrit() throws IOException {
        Map<String, Object> ligne = ligneValide();
        ligne.put("urlPhoto", null);

        RapportImportUsers rapport = importService.importer(classeur(ligne));

        assertThat(rapport.lignes().get(0).statut()).isEqualTo(Statut.CREE);
        assertThat(dossierPhotos).isEmptyDirectory();
        // Seul le rattachement d'une photo repasse par le dépôt.
        verify(userRepository, never()).save(any(UserApp.class));
    }

    @Test
    void un_classeur_sans_ligne_de_donnees_ne_cree_rien() throws IOException {
        RapportImportUsers rapport = importService.importer(classeur(List.of()));

        assertThat(rapport.total()).isZero();
        assertThat(rapport.crees()).isZero();
        assertThat(rapport.lignes()).isEmpty();
        verify(userService, never()).save(any(UserApp.class));
    }

    // -----------------------------------------------------------------
    // Outils
    // -----------------------------------------------------------------

    private UserApp compteEnregistre() {
        var captor = org.mockito.ArgumentCaptor.forClass(UserApp.class);
        verify(userService).save(captor.capture());
        return captor.getValue();
    }

    private Map<String, Object> ligneValide() {
        Map<String, Object> ligne = new LinkedHashMap<>();
        ligne.put("username", "rakoto.j");
        ligne.put("email", "jean@exemple.mg");
        ligne.put("Nom", "RAKOTO");
        ligne.put("Prenom", "Jean");
        ligne.put("cin", "101234567890");
        ligne.put("contact", "0341234567");
        ligne.put("password", "Secret2026");
        ligne.put("urlPhoto", null);
        return ligne;
    }

    private InputStream classeur(Map<String, Object> ligne) throws IOException {
        return classeur(List.of(ligne));
    }

    private InputStream classeur(List<Map<String, Object>> lignes) throws IOException {
        Map<String, Integer> entetes = new LinkedHashMap<>();
        for (int i = 0; i < COLONNES.size(); i++) {
            entetes.put(COLONNES.get(i), i);
        }
        return classeur(entetes, lignes);
    }

    /** Fabrique un vrai .xlsx en mémoire : le test lit ce que lira la production. */
    private InputStream classeur(Map<String, Integer> entetes, List<Map<String, Object>> lignes) throws IOException {
        ByteArrayOutputStream sortie = new ByteArrayOutputStream();
        ExcelUtils.write(new ArrayList<>(lignes), entetes, sortie);
        return new ByteArrayInputStream(sortie.toByteArray());
    }
}
