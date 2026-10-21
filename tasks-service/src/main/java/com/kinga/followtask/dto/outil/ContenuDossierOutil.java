package com.kinga.followtask.dto.outil;

import com.kinga.followtask.entity.enumapp.TypeOutil;

import java.util.List;

/**
 * Ce que montre un dossier du menu Outils (DT-019) : ses sous-dossiers puis
 * ses outils.
 *
 * @param dossier         null a la racine du type
 * @param chemin          dossiers du premier niveau jusqu'a celui-ci, pour le fil d'Ariane
 * @param peutCreerDossier faux au niveau le plus profond
 */
public record ContenuDossierOutil(TypeOutil typeOutil,
                                  DossierOutilVue dossier,
                                  List<DossierOutilVue> chemin,
                                  List<DossierOutilVue> dossiers,
                                  List<OutilVue> outils,
                                  boolean peutCreerDossier) {
}
