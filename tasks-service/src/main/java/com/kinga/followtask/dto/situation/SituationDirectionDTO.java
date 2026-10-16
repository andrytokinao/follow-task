package com.kinga.followtask.dto.situation;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Ecran « Situation du jour » de la direction (DT-005) : peut-on croire ce
 * qu'on lit, ou en est-on, qui fait quoi. Calcule a chaque demande.
 *
 * @param instant   heure du serveur a laquelle la situation a ete calculee
 * @param aTraiter  projets en retard ou bloques, les plus en retard d'abord
 * @param personnes ouvriers, ceux qui demandent l'attention d'abord
 */
public record SituationDirectionDTO(LocalDateTime instant,
                                    FiabiliteDTO fiabilite,
                                    ChiffresProjetsDTO chiffres,
                                    List<ProjetATraiterDTO> aTraiter,
                                    List<SituationPersonneDTO> personnes) {
}
