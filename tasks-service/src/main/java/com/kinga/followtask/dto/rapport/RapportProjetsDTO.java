package com.kinga.followtask.dto.rapport;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Rapport portant sur plusieurs projets à la fois.
 *
 * Ce n'est pas un rapport d'un autre genre : c'est une consolidation de
 * {@link RapportProjetDTO} déjà construits, augmentée d'une synthèse commune.
 * Chaque projet garde donc exactement les chiffres qu'il afficherait seul, et
 * un rapport à un seul projet sélectionné dit la même chose que le rapport
 * individuel.
 *
 * @param departement espace de travail commun aux projets retenus, {@code null}
 *                    s'ils n'en partagent pas un seul — le rapport reste alors
 *                    valable, il ne peut simplement pas être intitulé par lui
 * @param genereLe    horodatage de production : un document imprimé ne dit rien
 *                    de sa fraîcheur sans cela
 */
public record RapportProjetsDTO(String departement,
                                String prefixeDepartement,
                                LocalDateTime genereLe,
                                SyntheseProjetsDTO synthese,
                                List<RapportProjetDTO> projets) {
}
