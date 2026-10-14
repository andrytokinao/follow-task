package com.kinga.followtask.service.annuaire;

/**
 * Une personne telle que la décrit un annuaire externe, ramenée au vocabulaire
 * de l'application.
 *
 * <p>C'est le seul format que le reste de l'import connaît : chaque
 * {@link SourceAnnuaire} traduit sa propre réponse (noms de champs, structure)
 * vers ce record, si bien qu'ajouter une source ne touche ni la détection des
 * doublons ni la création du compte.</p>
 *
 * @param source     code de la source qui a fourni le profil
 * @param idExterne  identifiant de la personne dans cette source
 * @param nom        nom de famille
 * @param prenoms    prénom(s)
 * @param email      adresse électronique
 * @param telephone  numéro tel que fourni, non nettoyé
 * @param cin        numéro de carte d'identité
 * @param adresse    adresse postale
 * @param poste      fonction occupée, affichée à titre indicatif
 * @param photoUrl   adresse de la photo, ou {@code null}
 */
public record ProfilExterne(String source,
                            String idExterne,
                            String nom,
                            String prenoms,
                            String email,
                            String telephone,
                            String cin,
                            String adresse,
                            String poste,
                            String photoUrl) {
}
