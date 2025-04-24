package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import org.springframework.util.StringUtils;

import java.util.Collections;
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

    @Override
    public Set<String> generateUserToNotify() {
        return issue.getObserverIds();
    }

}
