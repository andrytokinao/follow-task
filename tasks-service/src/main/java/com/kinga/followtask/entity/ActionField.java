package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Set;

@Entity
@DiscriminatorValue("FIELD")
@Data
public class ActionField extends ActionItem {
    private String fieldName;
    private String fieldValue;
    private String oldValue;
    @Override
    public String buildMDetails() {
        return actionGroupe.getUser().getFirstName() +" Change field "+fieldName + (oldValue == null ? "" : " "+oldValue) +" to "+fieldValue ;
    }

    @Override
    public Set<String> generateUserToNotify() {
        return issue.getObserverIds();
    }
}
