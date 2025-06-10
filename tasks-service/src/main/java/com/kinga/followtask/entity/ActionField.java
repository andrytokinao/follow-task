package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@DiscriminatorValue("FIELD")
@Data
public class ActionField extends ActionItem {
    private String fieldName;
    private String fieldValue;
    private String oldValue;
    @ManyToOne
    private CustomFieldValue value;
    @Override
    public String buildMDetails() {
        return actionGroupe.getUser().getFirstName() +" Change field "+fieldName + (oldValue == null ? "" : " "+oldValue) +" to "+fieldValue ;
    }

    @Override
    public String buildMDetails(String userIdToNotify) {
        return this.buildMDetails();
    }

    @Override
    public Set<String> generateUserToNotify() {
        return issue.getObserverIds();
    }
    @Override
    public Set<String> generateUserToNotifySpecific() {
        return new HashSet<>();
    }
}
