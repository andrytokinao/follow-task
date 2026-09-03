package com.kinga.followtask.dto.rapport;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Rapport portant sur une ou plusieurs personnes d'un espace de travail.
 *
 * Même principe que {@link RapportProjetsDTO} : une personne sélectionnée seule
 * donne son rapport individuel, plusieurs donnent le même document augmenté
 * d'une synthèse commune. Le choix de mettre plusieurs personnes dans un seul
 * rapport appartient à celui qui l'édite, pas au serveur.
 *
 * @param departement espace de travail sur lequel l'activité est mesurée : les
 *                    heures passées ailleurs n'entrent pas dans ce rapport
 */
public record RapportPersonnesDTO(String departement,
                                  String prefixeDepartement,
                                  LocalDateTime genereLe,
                                  SynthesePersonnesDTO synthese,
                                  List<RapportPersonneDTO> personnes) {
}
