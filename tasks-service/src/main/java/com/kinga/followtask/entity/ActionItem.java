package com.kinga.followtask.entity;

import com.kinga.followtask.dto.ActionItemInput;
import com.kinga.followtask.entity.converter.MapToJsonConverter;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
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

    /**
     * Nature de l'action, telle que la lit l'historique.
     *
     * La colonne n'est pas renseignée par tous les chemins de création —
     * addDocumentAction ne la posait pas —, alors que le discriminant, lui,
     * l'est toujours. Sans ce repli, ces lignes arriveraient au front sans type
     * et ne sauraient pas quel affichage choisir.
     */
    public ActionType getActionType() {
        return actionType != null ? actionType : typeParDefaut();
    }

    /** Le type que porte, par construction, chaque sous-classe. */
    protected abstract ActionType typeParDefaut();

    /**
     * Date de l'action, en ISO-8601. Elle vit sur le groupe ; le Date brut
     * sortirait en « Thu Sep 17 ... » que le pipe date du front ne lit pas.
     */
    public String getDate() {
        Date created = actionGroupe == null ? null : actionGroupe.getCreated();
        return created == null ? null : created.toInstant().toString();
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

    /**
     * Cet évènement mérite-t-il une notification ?
     *
     * Par défaut oui : une affectation, un commentaire ou un document
     * s'adressent nommément à quelqu'un. Seul le changement de statut a une
     * raison de se taire, et c'est {@link ActionStatus} qui la porte — pas un
     * test de type ailleurs, qu'il faudrait retrouver et compléter à chaque
     * nouveau type d'action.
     */
    public boolean doitNotifier(RegleNotification regle) {
        return true;
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

    /**
     * Qui est assigné à la tâche — en interrogeant les deux stockages.
     *
     * Ils coexistent : les IssueMembership de rôle ASSIGNEE, et le champ
     * historique {@code Issue.assigne}. Les tâches antérieures aux memberships
     * n'ont que le second. S'en tenir à getAssignes() ne trouve alors
     * personne, et l'évènement ne prévient pas l'assigné.
     */
    protected Set<String> assigneIds() {
        Set<String> ids = new HashSet<>();
        if (issue == null) {
            return ids;
        }
        List<UserApp> parMembership = issue.getAssignes();
        if (parMembership != null) {
            parMembership.stream()
                    .filter(u -> u != null && u.getId() != null)
                    .forEach(u -> ids.add(u.getId()));
        }
        if (issue.getAssigne() != null && issue.getAssigne().getId() != null) {
            ids.add(issue.getAssigne().getId());
        }
        return ids;
    }

    protected boolean estAssigne(String userId) {
        return userId != null && assigneIds().stream().anyMatch(userId::equalsIgnoreCase);
    }

    /** Au-delà, l'extrait encombre la carte de notification sans rien apporter. */
    protected static final int LONGUEUR_EXTRAIT = 120;

    /**
     * Extrait lisible d'un texte saisi dans un éditeur riche : le balisage est
     * retiré et les entités décodées, sinon la notification afficherait des
     * &lt;p&gt; au lieu de la phrase.
     */
    protected String extrait(String texte) {
        if (texte == null) {
            return "";
        }
        String propre = texte
                .replaceAll("<[^>]*>", " ")
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replaceAll("\\s+", " ")
                .trim();
        if (propre.length() <= LONGUEUR_EXTRAIT) {
            return propre;
        }
        return propre.substring(0, LONGUEUR_EXTRAIT).trim() + "…";
    }
}
