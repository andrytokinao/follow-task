package com.kinga.followtask.entity;

import com.kinga.followtask.entity.converter.IssueDocumentUsage;
import com.kinga.followtask.entity.enumapp.IssueRole;
import com.kinga.utils.KingaUtils;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.CollectionUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;


@Entity
@Data
@NoArgsConstructor
public class Issue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private LocalDateTime creationDate;
    private LocalDateTime updateDate;
    private String summary;
    private String issueKey;
    @Lob
    @Column(nullable = true,columnDefinition = "LONGTEXT")
    private String description;
    private String directory;
    @ManyToMany
    private List<UserApp> observers;
    @Convert(converter = StringSetConverter.class)
    private Set<String> observerIds = new HashSet<>();
    @ManyToOne
    private Status status;
    @ManyToOne
    @JoinColumn(name = "type")
    private IssueType issueType;
    @OneToMany(mappedBy = "issues")
    private List<Document>  documents;
    @ManyToOne
    @JoinColumn(name = "assigne")
    private UserApp assigne;
    @ManyToOne
    @JoinColumn(name = "reporter")
    private UserApp reporter;
    @OneToMany
    private List<EntryTime> entryTime;
    @ManyToOne
    private Issue parent;
    @OneToMany(mappedBy = "parent")
    private List<Issue> children;
    @OneToMany(mappedBy = "issue")
    private List<Comment> comments;
    @OneToMany(mappedBy = "issue")
    private List<CustomFieldValue> values;
    @OneToMany(mappedBy = "issue")
    private List<PlanningEvent> events = new ArrayList<>();
    @OneToMany(mappedBy = "issue")
    private List<IssueLabels> labels = new ArrayList<>();
    @ManyToOne
    private Project project;
    @OneToMany(mappedBy = "issue")
    private List<IssueMembership> memberships;

    @OneToMany(mappedBy = "issue")
    private List<IssueCanalLink> canalLinks;

    @OneToMany(mappedBy = "issue")
    private List<IssueMessageLink> messageLinks;
    @OneToMany(mappedBy = "issue")
    private List<IssueDocumentUsage> documentUsages;
    public String getEncodedPath(){
        return KingaUtils.encodeText(this.getDirectory());
    }
    /**
     * Membres actuellement rattaches a l'issue (assignation non revoquee).
     */
    public List<IssueMembership> getActiveMemberships() {
        if (CollectionUtils.isEmpty(memberships)) {
            return new ArrayList<>();
        }
        return memberships.stream()
                .filter(m -> m.getUnassignedAt() == null)
                .sorted(Comparator.comparing(IssueMembership::getAssignedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    /**
     * Utilisateurs actuellement assignes a l'issue (role ASSIGNEE ou superieur).
     */
    public List<UserApp> getAssignes() {
        return getActiveMemberships().stream()
                .filter(m -> m.getRole() != null && m.getRole().atLeast(IssueRole.ASSIGNEE))
                .map(IssueMembership::getUser)
                .toList();
    }

    public Set<String> addObserverIds(String observerId) {
        if (this.observerIds == null) {
            this.observerIds = new HashSet<>();
        }
        this.observerIds.add(observerId);
        return this.observerIds;
    }

    // -----------------------------------------------------------------
    // Avancement dérivé des PlanningEvent liés à l'issue
    // -----------------------------------------------------------------

    /**
     * Pourcentage de complétion "courant" de l'issue, déduit de ses événements :
     * - s'il existe un événement actuellement EN COURS (start <= maintenant,
     *   et end null ou end >= maintenant), on prend son completionPercentage
     *   (c'est la donnée la plus fraîche possible) ;
     * - sinon, on prend le completionPercentage du dernier événement TERMINÉ
     *   (end <= maintenant), trié par date de fin décroissante ;
     * - sinon (aucun événement passé ou en cours), null.
     */
    public Integer getCurrentCompletionPercent() {
        PlanningEvent reference = resolveCurrentEvent();
        return reference == null ? null : reference.getCompletionPercentage();
    }

    /**
     * Événement de référence de l'issue : celui qui décrit le mieux son état
     * actuel, selon la règle décrite sur {@link #getCurrentCompletionPercent()}
     * (l'événement en cours, sinon le dernier terminé, sinon rien).
     *
     * <p>Volontairement sans préfixe {@code get} : ce n'est pas une propriété de
     * l'entité, et un accesseur au sens JavaBean serait sérialisé, ramenant un
     * cycle événement -> issue dans les réponses JSON.</p>
     */
    public PlanningEvent resolveCurrentEvent() {
        if (events == null || events.isEmpty()) {
            return null;
        }
        LocalDateTime now = LocalDateTime.now();

        Optional<PlanningEvent> ongoing = events.stream()
                .filter(e -> e.getStartTime() != null && !e.getStartTime().isAfter(now))
                .filter(e -> e.getEndTime() == null || !e.getEndTime().isBefore(now))
                .max(Comparator.comparing(PlanningEvent::getStartTime));

        if (ongoing.isPresent()) {
            return ongoing.get();
        }

        return events.stream()
                .filter(e -> e.getEndTime() != null && !e.getEndTime().isAfter(now))
                .max(Comparator.comparing(PlanningEvent::getEndTime))
                .orElse(null);
    }

    /**
     * Durée totale déjà écoulée sur l'ensemble des événements de l'issue,
     * PLUS ceux de ses issues enfants (récursif, sous-tâches incluses),
     * par rapport à l'heure actuelle :
     * - événement terminé (end renseigné et passé) -> durée réelle (end - start) ;
     * - événement en cours (start déjà passé, end absent ou dans le futur)
     *   -> durée plafonnée à maintenant (now - start), puisque sa vraie fin
     *   n'est pas encore connue ;
     * - événement pas encore démarré (start dans le futur) -> ignoré (0) ;
     * - événement sans start -> ignoré.
     */
    public Duration getElapsedDuration() {
        Duration total = getOwnElapsedDuration();

        if (children != null) {
            for (Issue child : children) {
                total = total.plus(child.getElapsedDuration());
            }
        }

        return total;
    }
    public Integer getElapsedDurationMinutes (){
        return (int)this.getElapsedDuration().toMinutes();
    }
    /**
     * Durée écoulée sur les seuls événements directement rattachés à cette
     * issue, sans tenir compte des enfants (utilisé par getElapsedDuration()
     * comme brique de base à chaque niveau de la récursion).
     */
    private Duration getOwnElapsedDuration() {
       return KingaUtils.getOwnElapsedDuration(events);
    }

    public List<PlanningEvent> getAllEvents() {
        List<PlanningEvent> events = this.getEvents();
        if (CollectionUtils.isEmpty(this.getChildren()))
            return events;
        for (Issue issue : getChildren()){
            events.addAll(issue.getAllEvents());
        }
        return events;
    }
}
