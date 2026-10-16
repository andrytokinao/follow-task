package com.kinga.followtask.service.situation;

/**
 * Ce que l'on sait d'un ouvrier a un instant donne, d'apres son seul planning.
 *
 * L'ordre de declaration est l'ordre d'affichage : ce qui demande l'attention
 * de la direction d'abord. « Non renseigne » ne veut pas dire absent : les
 * absences ne sont pas connues de l'application.
 */
public enum EtatPersonne {

    /** Rien de planifie aujourd'hui, alors que le seuil de tolerance est depasse. */
    NON_RENSEIGNE(false),
    /** L'activite en cours est declaree bloquee. */
    BLOQUE(true),
    /** Des activites plus tot dans la journee, mais rien en ce moment. */
    TROU_EN_COURS(false),
    /** Rien en ce moment, depuis moins que le seuil : le temps de passer a la suite. */
    PAUSE_COURTE(true),
    /** Une activite couvre l'instant present. */
    EN_ACTIVITE(true),
    /** L'instant n'est dans aucune plage de travail (midi, soir, week-end). */
    HORS_HORAIRES(true);

    private final boolean planningAJour;

    EtatPersonne(boolean planningAJour) {
        this.planningAJour = planningAJour;
    }

    /** Vrai si le planning dit ce que fait la personne : il compte pour la fiabilite. */
    public boolean planningAJour() {
        return planningAJour;
    }
}
