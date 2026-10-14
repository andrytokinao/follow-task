package com.kinga.followtask.dto;

import com.kinga.followtask.entity.UserApp;

/**
 * Compte existant qui ressemble à une personne qu'on s'apprête à importer.
 *
 * <p>Ne transporte que de quoi reconnaître le compte : jamais l'entité
 * elle-même, qui porte le mot de passe.</p>
 *
 * @param id         id du compte existant
 * @param username   identifiant du compte existant
 * @param nomComplet nom et prénom du compte existant
 * @param email      email du compte existant
 * @param actif      faux si le compte est désactivé : il compte quand même
 * @param critere    ce qui a rapproché les deux fiches (« même email »…)
 * @param bloquante  vrai si le critère suffit à dire que c'est la même
 *                   personne ; faux s'il faut que l'administrateur confirme
 */
public record CorrespondanceUtilisateur(String id,
                                        String username,
                                        String nomComplet,
                                        String email,
                                        boolean actif,
                                        String critere,
                                        boolean bloquante) {

    public static CorrespondanceUtilisateur de(UserApp compte, String critere, boolean bloquante) {
        return new CorrespondanceUtilisateur(compte.getId(), compte.getUsername(), compte.getFullName(),
                compte.getEmail(), compte.estActif(), critere, bloquante);
    }
}
