package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@DiscriminatorValue("EVENT")
@NoArgsConstructor
public class ActionEventApp extends ActionItem {
    @ManyToOne
    private PlanningEvent event;

    @Override
    public String buildMDetails() {
        return this.getActionGroupe().getUser()+ " add planification of  "+this.issue.getIssueKey()+" "+this.issue.getSummary();
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
