package com.kinga.followtask.entity;

import com.kinga.followtask.dto.ActionItemInput;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.Set;

@Entity
@DiscriminatorValue("ASSIGN")
@Data
@NoArgsConstructor
public class ActionAssigne extends ActionItem {
    @ManyToOne
    protected UserApp assigne;
    @ManyToOne
    protected UserApp oldAssigne;
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
    public ActionAssigne(ActionItemInput action) {
        super();
        super.setActionType(ActionType.ASSIGN);
        super.setId(action.getId());
        super.setIssue(action.getIssue());
        super.setActionGroupe(action.getActionGroupe());
        this.setAssigne(action.getAssigne());
        this.setOldAssigne(action.getOldAssigne());
    }

}
