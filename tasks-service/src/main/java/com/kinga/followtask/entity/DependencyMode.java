package com.kinga.followtask.entity;

/**
 * Contrainte de planning d'un lien de dépendance ({@link IssueLink}), au sens
 * des diagrammes de Gantt : quelle borne de la source conditionne quelle
 * borne de la destination.
 */
public enum DependencyMode {
    /** La destination commence quand la source se termine (cas courant). */
    FINISH_TO_START,
    /** La destination commence quand la source commence. */
    START_TO_START,
    /** La destination se termine quand la source se termine. */
    FINISH_TO_FINISH,
    /** La destination se termine quand la source commence. */
    START_TO_FINISH
}
