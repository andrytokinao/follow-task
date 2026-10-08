package com.kinga.followtask.entity;

/**
 * Nature d'un lien entre deux tâches ({@link IssueLink}), lu de la source vers
 * la destination.
 *
 * <p>La relation parent / sous-tâche n'en fait pas partie : elle reste portée
 * par {@code Issue.parent}.</p>
 *
 * <p>{@code dependency} : le lien ordonne les deux tâches dans le temps. Ces
 * liens forment un graphe sans cycle, celui que dessinera le Gantt.</p>
 */
public enum LinkType {

    BLOCKS("bloque", "est bloquée par", true),
    PRECEDES("précède", "suit", true),
    TRIGGERS("déclenche", "est déclenchée par", true),
    RELATES_TO("est liée à", "est liée à", false),
    ;

    private final String outwardLabel;
    private final String inwardLabel;
    private final boolean dependency;

    LinkType(String outwardLabel, String inwardLabel, boolean dependency) {
        this.outwardLabel = outwardLabel;
        this.inwardLabel = inwardLabel;
        this.dependency = dependency;
    }

    public String getOutwardLabel() {
        return outwardLabel;
    }

    public String getInwardLabel() {
        return inwardLabel;
    }

    public boolean isDependency() {
        return dependency;
    }
}
