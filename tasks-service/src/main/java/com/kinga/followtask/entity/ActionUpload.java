package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.util.List;
import java.util.Set;

@Entity
@DiscriminatorValue("UPLOAD")
public class ActionUpload extends ActionItem {
    @Override
    public String buildMDetails() {
        return this.getActionGroupe().getUser().getFirstName() +" add comment "+this.getIssue().getSummary();
    }

    @Override
    public Set<String> generateUserToNotify() {
        return issue.getObserverIds();
    }

    @Override
    public Set<String> generateUserToNotifySpecific() {
        return Set.of();
    }

    @Override
    public String buildMDetails(String userIdToNotify) {
        return this.buildMDetails();
    }

}
