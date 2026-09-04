package com.kinga.followtask.dto.rapport;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Rapport composé : un seul document réunissant les sections demandées.
 *
 * <p>Rien n'y est calculé en propre. Chaque section est le rapport que l'on
 * obtiendrait en la demandant seule ({@link RapportProjetsDTO},
 * {@link RapportPersonnesDTO}, {@link RapportEquipeDTO}) : un projet dit ici ce
 * qu'il dit dans son rapport individuel, et une équipe ce qu'elle dirait
 * seule.</p>
 *
 * <p>Les sections non demandées valent {@code null} plutôt qu'un rapport vide :
 * « aucun projet sélectionné » et « les projets sélectionnés n'ont aucune
 * tâche » sont deux situations différentes, et l'affichage ne doit pas les
 * confondre.</p>
 *
 * @param titre       intitulé du document, saisi ou composé par le serveur
 * @param departement espace de travail du rapport, {@code null} si les sections
 *                    n'en partagent pas un seul
 */
public record RapportCompositeDTO(String titre,
                                  String departement,
                                  String prefixeDepartement,
                                  LocalDateTime genereLe,
                                  RapportProjetsDTO projets,
                                  RapportPersonnesDTO personnes,
                                  List<RapportEquipeDTO> equipes) {
}
