package com.kinga.followtask.dto;

import com.kinga.followtask.entity.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
public class ActionItemInput {
    private Long id;
    private ActionType actionType;
    private ActionGroupe actionGroupe;
    private Issue issue;
    private Map<String,String> details = new HashMap<>();
    private UserApp assigne;
    private UserApp oldAssigne;
    private PlanningEvent event;
    private UserApp profile;
    private Document document;
    private CustomFieldValue customFieldValue;
    private String oldStringValue ;
    private String newStringValue ;
    String oldStatus;
    String newStatus;
    private Status status;
    private Status oldStatusValue;
    public ActionItemInput(ActionItem action) {
        this.id = action.getId();
        this.actionType = action.getActionType();
        this.setActionGroupeDto(action.getActionGroupe());
        this.setIssue(simpifyIssue(action.getIssue()));
        this.setDetails(action.getDetails());
        if (action instanceof ActionAssigne) {
            this.setAssigne(((ActionAssigne) action).getAssigne());
            this.setOldAssigne(((ActionAssigne) action).getOldAssigne());
        } else if (action instanceof ActionStatus) {
            this.setStatus(((ActionStatus) action).getStatus());
            this.setOldStatus(((ActionStatus) action).getOldStatus());
            this.setStatus(((ActionStatus) action).getStatus());
            this.setOldStatusValue(((ActionStatus) action).getOldStatusValue());
        }
    }
    public void setStatus(Status status) {
        if (status == null)
            return;
        Status s = new Status();
        s.setId(status.getId());
        s.setDisplayName(status.getDisplayName());
        if (status.getIcone() != null) {
            Icone icone = new Icone();
            icone.setId(status.getIcone().getId());
            icone.setTypeIcone(status.getIcone().getTypeIcone());
            icone.setValue(status.getIcone().getValue());
            s.setIcone(icone);
        }
        this.status = status;
    }
    public void setAssigne(UserApp assigne) {
        if (assigne == null)
            return;
        this.assigne = simplifyUser(assigne);
    }
    public void setOldAssigne(UserApp oldAssigne) {
        if (oldAssigne == null)
            return;
        this.oldAssigne = simplifyUser(oldAssigne);
    }
    public void setIssue(Issue issue) {
        if (issue == null)
            return;
        Issue s = new Issue();
        s.setId(issue.getId());
        s.setProject(simplifyProject(issue.getProject()));
        s.setSummary(issue.getSummary());
        this.issue = issue;
    }
    private UserApp simplifyUser(UserApp user) {
        UserApp result = new UserApp();
        result.setId(user.getId());
        result.setPhoto(user.getPhoto());
        result.setFirstName(user.getFirstName());
        result.setLastName(user.getLastName());
        result.setUsername(user.getUsername());
        return  result;
    }
    private Project simplifyProject(Project project) {
        Project result = new Project();
        result.setId(project.getId());
        result.setName(project.getName());
        result.setPrefix(project.getPrefix());
        return result;
    }
    public void setActionGroupeDto(ActionGroupe actiongroupe) {
        if (actiongroupe == null)
            return;
        ActionGroupe s = new ActionGroupe();
        s.setId(actiongroupe.getId());
        s.setUser(simplifyUser(actiongroupe.getUser()));
        s.setCreated(actiongroupe.getCreated());
        s.setActions(new ArrayList<>());
        s.setIssue(simpifyIssue(actiongroupe.getIssue()));
        this.actionGroupe = s;
    }

    private Issue simpifyIssue(Issue issue) {
        Issue s = new Issue();
        s.setId(issue.getId());
        s.setProject(simplifyProject(issue.getProject()));
        s.setIssueKey(issue.getIssueKey());
        return s;
    }
}
