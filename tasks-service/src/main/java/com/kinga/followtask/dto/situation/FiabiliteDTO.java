package com.kinga.followtask.dto.situation;

import com.kinga.followtask.service.situation.NiveauFiabilite;

/**
 * Ce que vaut la situation affichee.
 *
 * @param ouvriers          personnes suivies
 * @param planningAJour     celles dont le planning dit ce qu'elles font maintenant
 * @param enHoraires        faux le soir, a midi ou le week-end : la part se lit alors sur le remplissage
 * @param remplissageJour   minutes couvertes / attendues aujourd'hui jusqu'a maintenant, en % ; null avant la journee
 * @param remplissageVeille idem pour le dernier jour ouvrable entier ; null s'il n'y en a pas
 * @param part              pourcentage qui donne le niveau ; null sans ouvrier ni journee a mesurer
 * @param niveau            null si la part est null
 */
public record FiabiliteDTO(int ouvriers,
                           int planningAJour,
                           boolean enHoraires,
                           Integer remplissageJour,
                           Integer remplissageVeille,
                           Integer part,
                           NiveauFiabilite niveau) {
}
