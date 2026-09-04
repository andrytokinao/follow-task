package com.kinga.followtask.dto.rapport;

import java.time.LocalDateTime;

/**
 * Un projet proposé à la sélection : une demande racine de l'espace de travail.
 *
 * @param nombreTaches nombre de tâches rattachées. Le nombre est affiché à côté
 *                     du nom parce qu'un projet sans tâche donne un rapport
 *                     vide : autant le savoir avant de le retenir, plutôt
 *                     qu'après avoir édité le document
 * @param statut       statut du workflow, tel qu'il est saisi sur la demande.
 *                     Ce n'est pas le statut dérivé du rapport, qui demanderait
 *                     de calculer celui-ci pour chaque projet de la liste
 */
public record OptionProjetDTO(Long id,
                              String cle,
                              String titre,
                              String statut,
                              int nombreTaches,
                              LocalDateTime creeLe) {
}
