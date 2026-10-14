package com.kinga.followtask.dto;

import com.kinga.followtask.service.annuaire.ProfilExterne;

import java.util.List;

/**
 * Ce que deviendrait une fiche d'annuaire si on l'importait maintenant.
 *
 * <p>Calculé avant l'import pour que l'administrateur voie la personne et ses
 * éventuels doublons, et décide des homonymes ; recalculé pendant l'import,
 * puisque la base a pu changer entre-temps.</p>
 *
 * @param reference       adresse ou identifiant saisi
 * @param profil          fiche lue, {@code null} si illisible
 * @param verdict         sort prévu
 * @param correspondances comptes existants qui lui ressemblent
 * @param erreur          motif quand la fiche n'a pas pu être lue
 */
public record ApercuImportAnnuaire(String reference,
                                   ProfilExterne profil,
                                   Verdict verdict,
                                   List<CorrespondanceUtilisateur> correspondances,
                                   String erreur) {

    public enum Verdict {
        /** Aucun compte ne lui ressemble : sera créé. */
        NOUVEAU,
        /** Seul un homonyme existe : créé uniquement si l'administrateur confirme. */
        A_CONFIRMER,
        /** Même email, téléphone ou CIN qu'un compte existant : sera ignoré. */
        DEJA_PRESENT,
        /** La fiche n'a pas pu être lue. */
        ILLISIBLE
    }
}
