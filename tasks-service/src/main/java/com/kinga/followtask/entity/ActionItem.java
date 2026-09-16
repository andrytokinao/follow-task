package com.kinga.followtask.entity;

import com.kinga.followtask.dto.ActionItemInput;
import com.kinga.followtask.entity.converter.MapToJsonConverter;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "action_type", discriminatorType = DiscriminatorType.STRING)
@Data
@NoArgsConstructor
public abstract class ActionItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "item_action_type")
    @Enumerated(EnumType.STRING)
    protected ActionType actionType;
    @ManyToOne
    protected ActionGroupe actionGroupe;
    @ManyToOne
    protected Issue issue;
    @Convert(converter = MapToJsonConverter.class)
    protected Map<String,String> details = new HashMap<>();

    public static ActionItem fromInput(ActionItemInput action) {
        switch (action.getActionType()) {
            case ASSIGN -> {
                return new ActionAssigne(action);
            }
            case STATUS -> {
                return new ActionStatus(action);
            }
        }
        return null;
    }

    public abstract String buildMDetails();
    public abstract String buildMDetails(String userIdToNotify);

    public abstract Set<String> generateUserToNotify() ;

    public abstract Set<String> generateUserToNotifySpecific() ;

    /**
     * Titre court de la notification, affiché en tête de carte. Il dit la
     * nature de l'évènement ; le message, lui, dit qui a fait quoi sur quelle
     * tâche.
     */
    public String buildTitle() {
        return "Activité";
    }

    // -----------------------------------------------------------------
    // Fragments de phrase partagés par tous les types d'action
    // -----------------------------------------------------------------

    /**
     * Nom lisible de l'auteur de l'action. On préfère « Prénom Nom » ; à
     * défaut l'identifiant de connexion, jamais un champ vide qui donnerait
     * une phrase commençant par une espace.
     */
    protected String auteur() {
        return nomDe(actionGroupe == null ? null : actionGroupe.getUser());
    }

    /** Idem pour un utilisateur quelconque (assigné, destinataire, ...). */
    protected String nomDe(UserApp user) {
        if (user == null) {
            return "Quelqu'un";
        }
        String prenom = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String nom = user.getLastName() == null ? "" : user.getLastName().trim();
        String complet = (prenom + " " + nom).trim();
        if (!complet.isEmpty()) {
            return complet;
        }
        return user.getUsername() == null || user.getUsername().isBlank() ? "Quelqu'un" : user.getUsername();
    }

    /**
     * Désignation de la tâche : « PRJ-12 · Corriger la connexion ». La clé
     * seule ne dit pas de quoi il s'agit, et le titre seul ne permet pas de
     * retrouver la tâche ; les deux ensemble se suffisent.
     */
    protected String tache() {
        if (issue == null) {
            return "";
        }
        String cle = issue.getIssueKey() == null ? "" : issue.getIssueKey().trim();
        String titre = issue.getSummary() == null ? "" : issue.getSummary().trim();
        if (titre.isEmpty()) {
            return cle;
        }
        return cle.isEmpty() ? titre : cle + " · " + titre;
    }

    /** « la sous-tâche » ou « la demande », selon la place de l'issue. */
    protected String natureTache() {
        return issue != null && issue.getParent() != null ? "la sous-tâche" : "la demande";
    }
}
