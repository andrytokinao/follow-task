package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@DiscriminatorValue("STATUS")
public class ActionStatus extends ActionItem {
    String oldStatus;
    String newStatus;
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

}
