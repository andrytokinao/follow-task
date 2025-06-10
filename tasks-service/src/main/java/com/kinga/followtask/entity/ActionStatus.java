package com.kinga.followtask.entity;

import com.kinga.followtask.dto.ActionItemInput;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Entity
@DiscriminatorValue("STATUS")
@Data
public class ActionStatus extends ActionItem {

    String oldStatus;
    String newStatus;
    @ManyToOne
    private Status status;
    @ManyToOne
    private Status oldStatusValue;
    @Override
    public String buildMDetails() {
        return this.getActionGroupe().getUser().getFirstName() + " Change status " +oldStatus + " to " + newStatus;
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
