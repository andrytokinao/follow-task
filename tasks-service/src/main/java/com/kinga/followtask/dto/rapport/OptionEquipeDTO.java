package com.kinga.followtask.dto.rapport;

import java.util.List;

/**
 * Une équipe proposée à la sélection : un groupe d'utilisateurs de l'espace de
 * travail.
 *
 * @param membreIds identifiants des membres. Transmis avec l'équipe pour que le
 *                  formulaire puisse cocher les personnes correspondantes sans
 *                  second appel — choisir une équipe, c'est d'abord choisir ses
 *                  membres
 */
public record OptionEquipeDTO(Long id,
                              String nom,
                              List<String> membreIds) {
}
