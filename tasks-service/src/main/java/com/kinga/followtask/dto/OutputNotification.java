package com.kinga.followtask.dto;

import com.kinga.followtask.entity.ActionGroupe;
import com.kinga.followtask.entity.Notification;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.UserApp;
import lombok.Data;

import java.util.List;
@Data
public class OutputNotification {
    private Long id;
    private String message;
    private Project project;
    private ActionGroupe action;
    private String title;
    private List<String> seenUserIds;
    public OutputNotification(Notification notification) {
        setId(notification.getId());
        setMessage(notification.getMessage());
        setSeenUserIds(notification.getSeenUserIds());
        setAction(notification.getAction());
        setProject(notification.getProject());
    }

    public void setAction(ActionGroupe action) {
        ActionGroupe actionGroupe = new ActionGroupe();
        actionGroupe.setId(action.getId());
        UserApp userApp = new UserApp();
        userApp.setId(action.getUser().getId());
        userApp.setFirstName(action.getUser().getFirstName());
        userApp.setLastName(action.getUser().getLastName());
        userApp.setPhoto(action.getUser().getPhoto());
        actionGroupe.setUser(userApp);
        this.action = actionGroupe;
    }
    public void setProject(Project project) {
        Project p = new Project();
        p.setId(project.getId());
        p.setPrefix(project.getPrefix());
        this.project = p;
    }
}
