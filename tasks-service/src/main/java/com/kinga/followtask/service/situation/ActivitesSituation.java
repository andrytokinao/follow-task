package com.kinga.followtask.service.situation;

import com.kinga.followtask.dto.situation.ActiviteSituationDTO;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.Project;

/** Activite du planning → ligne « Maintenant » de l'ecran de situation. */
final class ActivitesSituation {

    private ActivitesSituation() {
    }

    static ActiviteSituationDTO versDto(PlanningEvent activite) {
        if (activite == null) {
            return null;
        }
        Issue tache = activite.getIssue();
        Issue projet = racine(tache);
        boolean tacheEstProjet = projet == tache;
        Project espace = espace(activite);
        return new ActiviteSituationDTO(
                activite.getId(),
                activite.getTitle(),
                activite.getStartTime(),
                activite.getEndTime(),
                activite.getExecutionStatus() == null ? null : activite.getExecutionStatus().name(),
                activite.getCompletionPercentage(),
                tache == null ? null : tache.getIssueKey(),
                tache == null ? null : tache.getSummary(),
                projet == null || tacheEstProjet ? null : projet.getIssueKey(),
                projet == null || tacheEstProjet ? null : projet.getSummary(),
                espace == null ? null : espace.getPrefix());
    }

    /** Espace de l'activite : le sien, a defaut celui de sa tache. */
    static Project espace(PlanningEvent activite) {
        if (activite == null) {
            return null;
        }
        if (activite.getProject() != null) {
            return activite.getProject();
        }
        return activite.getIssue() == null ? null : activite.getIssue().getProject();
    }

    /** Demande racine : le projet dont la tache fait partie. */
    private static Issue racine(Issue tache) {
        Issue courante = tache;
        while (courante != null && courante.getParent() != null) {
            courante = courante.getParent();
        }
        return courante;
    }
}
