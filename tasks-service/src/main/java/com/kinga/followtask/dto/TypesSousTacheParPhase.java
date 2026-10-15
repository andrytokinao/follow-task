package com.kinga.followtask.dto;

import com.kinga.followtask.entity.Phase;

import java.util.List;

/**
 * Types proposables pour une nouvelle sous-tache, rapportes a la phase
 * courante du projet.
 *
 * @param phaseCourante phase en cours du projet ; null si son statut n'en designe aucune
 * @param choix         entrees dans l'ordre du projet : par phase, puis les types sans phase
 */
public record TypesSousTacheParPhase(Phase phaseCourante, List<ChoixTypeSousTache> choix) {
}
