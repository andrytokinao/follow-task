package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;

import java.util.List;
import java.util.Set;

@Entity
@DiscriminatorValue("COMMENT")
public class ActionComment extends ActionItem {
    @ManyToOne
    private Document document;

    @Override
    public String buildMDetails() {
        return this.getActionGroupe().getUser().getFirstName() +" add comment "+this.getIssue().getIssueKey() +" "+ getIssue().getSummary();
    }

    @Override
    public Set<String> generateUserToNotify() {
        return  issue.getObserverIds();
    }
}
