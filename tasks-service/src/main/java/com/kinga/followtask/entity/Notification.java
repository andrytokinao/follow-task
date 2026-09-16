package com.kinga.followtask.entity;

import ch.qos.logback.classic.pattern.DateConverter;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;

@Entity
@Data
@NoArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String titre ;
    @ManyToOne(fetch = FetchType.EAGER)
    private Project project;
    private String message;
    @Convert(converter = StringSetConverter.class)
    private Set<String> userIds;
    @Convert(converter = StringListConverter.class)
    private List<String> seenUserIds = new ArrayList<>();
    @Convert(converter = StringListConverter.class)
    private List<String> readUserIds = new ArrayList<>();
    @ManyToOne
    private ActionGroupe action;

    public Set<String> getUserIds() {
        if (this.userIds == null)
            this.userIds = new HashSet<>();
        return userIds;
    }

    public List<String> getSeenUserIds() {
        if (this.seenUserIds == null)
            this.seenUserIds = new ArrayList<>();
        return seenUserIds;
    }

    public List<String> getReadUserIds() {
        if (this.readUserIds == null)
            this.readUserIds = new ArrayList<>();
        return readUserIds;
    }
    /**
     * Route du front vers la tâche. Une sous-tâche s'ouvre dans la page de sa
     * demande (…/issue/{demande}/subtask/{clé}) : c'est là qu'elle est
     * affichée et marquée lue. La traiter comme une demande l'ouvrait seule,
     * hors de son contexte.
     */
    public List<String> getIssueLinks(){
        Issue issue = getIssue();
        if (issue == null || issue.getIssueKey() == null)
            return new ArrayList<>();
        Issue parent = issue.getParent();
        Project projet = issue.getProject() != null ? issue.getProject()
                : parent == null ? null : parent.getProject();
        if (projet == null)
            return new ArrayList<>();
        if (parent != null && parent.getIssueKey() != null)
            return Arrays.asList("/working", projet.getPrefix(), "issue", parent.getIssueKey(), "subtask", issue.getIssueKey());
        return Arrays.asList("/working", projet.getPrefix(), "issue", issue.getIssueKey(), "details");
    }

    /**
     * La tâche concernée, portée par le groupe d'actions. Le front s'en sert
     * pour rattacher la notification à une ligne de liste et à un projet ;
     * l'exposer ici évite de faire descendre le client dans action.issue.
     */
    public Issue getIssue() {
        return action == null ? null : action.getIssue();
    }

    /**
     * Date de l'action, en ISO-8601. Rendue en texte parce que la même valeur
     * part par GraphQL et par le websocket : deux sérialiseurs différents qui
     * doivent livrer au front exactement la même chaîne.
     */
    public String getCreated() {
        Date date = action == null ? null : action.getCreated();
        return date == null ? null : date.toInstant().toString();
    }

    public boolean isSeenBy(String userId) {
        return userId != null && getSeenUserIds().stream().anyMatch(userId::equalsIgnoreCase);
    }

    /**
     * « Lu » au sens fort : l'utilisateur a ouvert la tâche concernée. C'est
     * cet état qui pilote les pastilles des menus, alors que « vu » ne
     * concerne que le compteur de la cloche.
     */
    public boolean isReadBy(String userId) {
        return userId != null && getReadUserIds().stream().anyMatch(userId::equalsIgnoreCase);
    }

    /** Idempotent : marquer deux fois ne duplique pas l'identifiant. */
    public boolean markSeen(String userId) {
        if (userId == null || isSeenBy(userId)) {
            return false;
        }
        getSeenUserIds().add(userId);
        return true;
    }

    /** Ouvrir la tâche vaut aussi pour le compteur de la cloche. */
    public boolean markRead(String userId) {
        if (userId == null) {
            return false;
        }
        boolean change = markSeen(userId);
        if (!isReadBy(userId)) {
            getReadUserIds().add(userId);
            change = true;
        }
        return change;
    }
}
