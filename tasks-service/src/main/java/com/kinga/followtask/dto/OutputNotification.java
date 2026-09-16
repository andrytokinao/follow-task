package com.kinga.followtask.dto;

import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.Notification;
import com.kinga.followtask.entity.UserApp;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Notification telle qu'elle part sur le websocket.
 *
 * Elle reprend, champ pour champ, ce que renvoie la requête GraphQL
 * getNotificationsByUserId : le front range les deux sources dans la même
 * liste, et une notification reçue en direct doit s'afficher exactement comme
 * la même notification rechargée depuis le serveur. C'est aussi pour cela que
 * la structure est plate — sérialiser les entités enverrait tout le graphe
 * (projet, workflow, sous-tâches) sur chaque évènement.
 */
@Data
public class OutputNotification {
    private Long id;
    private String titre;
    private String message;
    private String created;
    private OutputProject project;
    private OutputIssue issue;
    private OutputAction action;
    private List<String> seenUserIds = new ArrayList<>();
    private List<String> readUserIds = new ArrayList<>();
    private List<String> issueLinks = new ArrayList<>();

    public OutputNotification(Notification notification) {
        this.id = notification.getId();
        this.titre = notification.getTitre();
        this.message = notification.getMessage();
        this.created = notification.getCreated();
        this.seenUserIds = new ArrayList<>(notification.getSeenUserIds());
        this.readUserIds = new ArrayList<>(notification.getReadUserIds());
        this.issueLinks = notification.getIssueLinks();
        this.issue = OutputIssue.from(notification.getIssue());
        if (notification.getProject() != null) {
            this.project = new OutputProject(
                    notification.getProject().getId(),
                    notification.getProject().getPrefix(),
                    notification.getProject().getName());
        }
        if (notification.getAction() != null) {
            this.action = new OutputAction(
                    notification.getAction().getId(),
                    OutputUser.from(notification.getAction().getUser()),
                    this.issue);
        }
    }

    @Data
    public static class OutputProject {
        private final Long id;
        private final String prefix;
        private final String name;
    }

    @Data
    public static class OutputIssue {
        private final Long id;
        private final String issueKey;
        private final String summary;
        /** Identifiant de la demande parente, pour remonter la pastille. */
        private final Long parentId;

        static OutputIssue from(Issue issue) {
            if (issue == null) {
                return null;
            }
            return new OutputIssue(issue.getId(), issue.getIssueKey(), issue.getSummary(),
                    issue.getParent() == null ? null : issue.getParent().getId());
        }
    }

    @Data
    public static class OutputUser {
        private final String id;
        private final String username;
        private final String firstName;
        private final String lastName;
        private final String photo;

        static OutputUser from(UserApp user) {
            if (user == null) {
                return null;
            }
            return new OutputUser(user.getId(), user.getUsername(), user.getFirstName(),
                    user.getLastName(), user.getPhoto());
        }
    }

    @Data
    public static class OutputAction {
        private final Long id;
        private final OutputUser user;
        private final OutputIssue issue;
    }
}
