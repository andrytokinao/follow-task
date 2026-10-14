package com.kinga.followtask.service.annuaire;

import com.kinga.followtask.dto.ApercuImportAnnuaire;
import com.kinga.followtask.dto.ApercuImportAnnuaire.Verdict;
import com.kinga.followtask.dto.CorrespondanceUtilisateur;
import com.kinga.followtask.dto.DemandeImportAnnuaire;
import com.kinga.followtask.dto.RapportImportUsers;
import com.kinga.followtask.dto.RapportImportUsers.LigneImport;
import com.kinga.followtask.dto.RapportImportUsers.Statut;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.service.UserImportService;
import com.kinga.followtask.service.UserService;
import com.kinga.followtask.service.annuaire.doublon.DetecteurDoublons;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Création de comptes à partir de fiches d'annuaire externe.
 *
 * <p>Deux temps : {@link #apercu} lit les fiches et signale les doublons sans
 * rien écrire ; {@link #importer} crée les comptes. Entre les deux,
 * l'administrateur décide des homonymes.</p>
 *
 * <p>Comme pour le tableur, chaque fiche est traitée isolément et la méthode
 * n'est pas {@code @Transactional} : une fiche illisible ou refusée par
 * {@link UserService#save} n'empêche pas la création des autres.</p>
 */
@Service
@RequiredArgsConstructor
public class ImportAnnuaireService {

    private static final Logger logger = LoggerFactory.getLogger(ImportAnnuaireService.class);

    /** Chaque fiche coûte un appel réseau, et sa photo un second. */
    public static final int REFERENCES_MAX = 200;

    private final SourcesAnnuaire sources;
    private final DetecteurDoublons detecteur;
    private final UserService userService;
    private final UserImportService userImportService;

    public List<ApercuImportAnnuaire> apercu(List<String> references) {
        return nettoyer(references).stream().map(this::examiner).toList();
    }

    /**
     * Les fiches sont relues et les doublons recherchés à nouveau : la base a pu
     * changer depuis l'aperçu, et une même personne peut figurer deux fois dans
     * la liste — la seconde occurrence trouve alors le compte créé par la première.
     */
    public RapportImportUsers importer(DemandeImportAnnuaire demande) {
        if (demande == null || !StringUtils.hasText(demande.motDePasse())) {
            throw new IllegalArgumentException("Le mot de passe par défaut est obligatoire.");
        }
        List<String> references = nettoyer(demande.references());
        Set<String> confirmees = demande.confirmees() == null ? Set.of()
                : demande.confirmees().stream().map(String::trim).collect(Collectors.toSet());

        List<LigneImport> lignes = new ArrayList<>();
        int crees = 0;
        int rejetes = 0;
        int ignores = 0;
        for (int i = 0; i < references.size(); i++) {
            String reference = references.get(i);
            LigneImport ligne = traiter(i + 1, examiner(reference),
                    confirmees.contains(reference), demande.motDePasse());
            lignes.add(ligne);
            switch (ligne.statut()) {
                case REJETE -> rejetes++;
                case IGNORE -> ignores++;
                default -> crees++;
            }
        }
        return new RapportImportUsers(references.size(), crees, rejetes, ignores, lignes);
    }

    private ApercuImportAnnuaire examiner(String reference) {
        try {
            ProfilExterne profil = sources.lire(reference);
            List<CorrespondanceUtilisateur> correspondances = detecteur.chercher(profil);
            return new ApercuImportAnnuaire(reference, profil,
                    DetecteurDoublons.verdict(correspondances), correspondances, null);
        } catch (IOException e) {
            logger.info("Annuaire : fiche {} illisible ({})", reference, e.getMessage());
            return new ApercuImportAnnuaire(reference, null, Verdict.ILLISIBLE, List.of(), motif(e));
        }
    }

    private LigneImport traiter(int numero, ApercuImportAnnuaire apercu, boolean confirmee, String motDePasse) {
        String nom = apercu.profil() == null ? apercu.reference() : nomComplet(apercu.profil());
        switch (apercu.verdict()) {
            case ILLISIBLE:
                return new LigneImport(numero, nom, Statut.REJETE, apercu.erreur());
            case DEJA_PRESENT:
                return new LigneImport(numero, nom, Statut.IGNORE,
                        "Déjà présent : " + decrire(apercu.correspondances()));
            case A_CONFIRMER:
                if (!confirmee) {
                    return new LigneImport(numero, nom, Statut.IGNORE,
                            "Homonyme non confirmé : " + decrire(apercu.correspondances()));
                }
                break;
            default:
                break;
        }
        return creer(numero, apercu.profil(), motDePasse);
    }

    private LigneImport creer(int numero, ProfilExterne profil, String motDePasse) {
        UserApp utilisateur;
        try {
            utilisateur = userService.save(construire(profil, motDePasse));
        } catch (Exception e) {
            logger.info("Annuaire : {} rejeté ({})", nomComplet(profil), e.getMessage());
            return new LigneImport(numero, nomComplet(profil), Statut.REJETE, motif(e));
        }
        if (!StringUtils.hasText(profil.photoUrl())) {
            return new LigneImport(numero, utilisateur.getUsername(), Statut.CREE, "");
        }
        try {
            userImportService.rattacherPhoto(utilisateur, profil.photoUrl());
            return new LigneImport(numero, utilisateur.getUsername(), Statut.CREE, "");
        } catch (Exception e) {
            logger.info("Annuaire : photo ignorée pour {} ({})", utilisateur.getUsername(), e.getMessage());
            return new LigneImport(numero, utilisateur.getUsername(), Statut.CREE_SANS_PHOTO,
                    "Photo non récupérée : " + motif(e));
        }
    }

    /** L'identifiant est laissé vide : {@code UserService} le déduit du nom. */
    private UserApp construire(ProfilExterne profil, String motDePasse) {
        UserApp utilisateur = new UserApp();
        utilisateur.setLastName(texte(profil.nom()));
        utilisateur.setFirstName(texte(profil.prenoms()));
        utilisateur.setEmail(texte(profil.email()));
        utilisateur.setContact(texte(profil.telephone()));
        utilisateur.setCin(texte(profil.cin()));
        utilisateur.setAddress(texte(profil.adresse()));
        utilisateur.setPassword(motDePasse);
        return utilisateur;
    }

    /** Sans vides ni doublons, ordre conservé, et dans la limite autorisée. */
    private List<String> nettoyer(List<String> references) {
        if (references == null) {
            return List.of();
        }
        Set<String> uniques = new LinkedHashSet<>();
        for (String reference : references) {
            if (StringUtils.hasText(reference)) {
                uniques.add(reference.trim());
            }
        }
        if (uniques.size() > REFERENCES_MAX) {
            throw new IllegalArgumentException(
                    "Au plus " + REFERENCES_MAX + " fiches par import (" + uniques.size() + " reçues).");
        }
        return new ArrayList<>(uniques);
    }

    private String decrire(List<CorrespondanceUtilisateur> correspondances) {
        return correspondances.stream()
                .map(c -> c.username() + " (" + c.critere() + (c.actif() ? "" : ", compte désactivé") + ")")
                .distinct()
                .collect(Collectors.joining(", "));
    }

    private static String nomComplet(ProfilExterne profil) {
        return (texte(profil.nom()) + " " + texte(profil.prenoms())).trim();
    }

    private static String texte(String valeur) {
        return valeur == null ? "" : valeur.trim();
    }

    private static String motif(Exception e) {
        return StringUtils.hasText(e.getMessage()) ? e.getMessage() : e.getClass().getSimpleName();
    }
}
