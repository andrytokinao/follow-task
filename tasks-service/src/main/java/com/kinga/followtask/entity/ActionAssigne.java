package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@DiscriminatorValue("ASSIGN")
@Data
public class ActionAssigne extends ActionItem {
    @ManyToOne
    protected UserApp assigne;

    @Override
    public String buildMDetails() {
        if (this.issue != null  && this.assigne != null ) {
            assigne = this.issue.getAssigne();
            this.details.put("assigne", "Assigne to "+ assigne.toString() );
            return "Assigne to " + assigne.toString();
        }
        return "";
    }
    public String buildMDetails(String notify) {
        if (this.issue != null  && this.assigne != null &&  !StringUtils.isEmpty(notify) ) {
            assigne = this.issue.getAssigne();
            this.details.put("assigne", "Assigne to "+ assigne.getId() );
            return "Assigne "+issue.getIssueKey()+" to " + (assigne.getId().equalsIgnoreCase(notify)? " You" : assigne.getUsername());
        }
        return "";
    }
    @Override
    public Set<String> generateUserToNotify() {
        return issue.getObserverIds();
    }
    @Override
    public Set<String> generateUserToNotifySpecific() {
        if (assigne != null) {
            return Set.of(assigne.getId());
        }
        return new HashSet<>();
    }

}
