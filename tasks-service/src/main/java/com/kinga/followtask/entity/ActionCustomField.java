package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.Data;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@DiscriminatorValue("CUSTOM_FIELD")
@Data
public class ActionCustomField extends ActionItem {
    @ManyToOne
    private CustomFieldValue customFieldValue;

    private String oldStringValue ;
    private String newStringValue ;

    @Override
    public String buildMDetails() {
        return getActionGroupe().getUser().getFirstName()+" change "+this.getCustomFieldValue().getCustomField().getName() +" to "+this.getCustomFieldValue().getStrinValue();
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
