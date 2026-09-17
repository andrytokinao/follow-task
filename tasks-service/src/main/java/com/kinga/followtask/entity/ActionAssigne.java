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
    protected ActionType typeParDefaut() {
        return ActionType.ASSIGN;
    }
    @Override
    public String buildMDetails() {
        return buildMDetails(null);
    }

    /**
     * Deux formulations, selon qu'on écrit au nouvel assigné ou aux autres
     * observateurs : « Andry vous a assigné la sous-tâche PRJ-12 · ... » ou
     * « Andry a assigné la sous-tâche PRJ-12 · ... à Rakoto ». Le destinataire
     * doit comprendre en une ligne si c'est à lui d'agir.
     */
    @Override
    public String buildMDetails(String notify) {
        if (this.issue == null || this.assigne == null) {
            return "";
        }
        this.details.put("assigne", assigne.getId());
        boolean pourMoi = !StringUtils.isEmpty(notify) && assigne.getId().equalsIgnoreCase(notify);
        if (pourMoi) {
            return auteur() + " vous a assigné " + natureTache() + " " + tache();
        }
        return auteur() + " a assigné " + natureTache() + " " + tache() + " à " + nomDe(assigne);
    }

    @Override
    public String buildTitle() {
        return "Nouvelle affectation";
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
