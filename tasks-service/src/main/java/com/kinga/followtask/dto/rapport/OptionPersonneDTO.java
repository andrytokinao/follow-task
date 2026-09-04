package com.kinga.followtask.dto.rapport;

/**
 * Une personne proposée à la sélection : un membre de l'espace de travail.
 *
 * @param nom nom affichable, construit selon la même règle que dans les
 *            rapports, pour qu'une personne se reconnaisse d'une liste à
 *            l'autre
 */
public record OptionPersonneDTO(String id,
                                String nom,
                                String username,
                                String email) {
}
