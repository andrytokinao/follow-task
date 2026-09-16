package com.kinga.followtask.entity;

import com.kinga.followtask.dto.ActionItemInput;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@DiscriminatorValue("STATUS")
@Data
@NoArgsConstructor
public class ActionStatus extends ActionItem {

    String oldStatus;
    String newStatus;
    @ManyToOne
    private Status status;
    @ManyToOne
    private Status oldStatusValue;
    /**
     * « Andry a fait passer la demande PRJ-12 · ... de « Ouvert » à « En cours » ».
     * Les colonnes oldStatus/newStatus ne sont renseignées que par le
     * constructeur d'entrée : on retombe sur les statuts liés pour les
     * notifications rejouées depuis la base.
     */
    @Override
    public String buildMDetails() {
        String avant = libelle(oldStatus, oldStatusValue);
        String apres = libelle(newStatus, status);
        String debut = auteur() + " a fait passer " + natureTache() + " " + tache();
        if (apres.isEmpty()) {
            return debut + " à un nouveau statut";
        }
        if (avant.isEmpty()) {
            return debut + " au statut « " + apres + " »";
        }
        return debut + " de « " + avant + " » à « " + apres + " »";
    }

    private String libelle(String brut, Status statut) {
        if (brut != null && !brut.isBlank()) {
            return brut.trim();
        }
        return statut == null || statut.getDisplayName() == null ? "" : statut.getDisplayName().trim();
    }

    @Override
    public String buildTitle() {
        return "Changement de statut";
    }

    @Override
    public Set<String> generateUserToNotify() {
        return issue.getObserverIds();
    }

    @Override
    public String buildMDetails(String userIdToNotify) {
        return this.buildMDetails();
    }
    @Override
    public Set<String> generateUserToNotifySpecific() {
        return new HashSet<>();
    }
    public ActionStatus(ActionItemInput action) {
        super();
        super.setId(action.getId());
        super.setActionType(action.getActionType());
        super.setActionGroupe(action.getActionGroupe());
        super.setDetails(action.getDetails());
        super.setIssue(action.getIssue());
        this.setStatus(action.getStatus());
        this.setOldStatusValue(action.getOldStatusValue());
        this.setOldStatus(this.oldStatusValue == null? "" : this.oldStatusValue.getDisplayName() );
        this.setNewStatus(this.status == null? "" : this.status.getDisplayName() );
    }

}
