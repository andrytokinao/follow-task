package com.kinga.followtask.assistant.tools;

import com.kinga.followtask.assistant.security.AssistantAuditService;
import com.kinga.followtask.assistant.security.ToolPermissionGuard;
import com.kinga.followtask.entity.CustomField;
import com.kinga.followtask.entity.DateCustomFieldValue;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.service.IssueService;
import com.kinga.followtask.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;

/**
 * Socle commun des outils de l'assistant.
 *
 * <p>Vocabulaire de l'application :</p>
 * <ul>
 *   <li><b>Espace de travail</b> = entite {@link Project} ; identifie par son prefixe ;</li>
 *   <li><b>Projet</b> = {@link Issue} parente (sans parent) ;</li>
 *   <li><b>Tache</b> = {@link Issue} enfant d'un projet.</li>
 * </ul>
 *
 * <p>Les outils s'executent hors requete web : les relations paresseuses des
 * entites ne se chargent que dans une transaction, d'ou {@link #enTransaction}.
 * Les outils renvoient des records plats, jamais les entites (cycles JSON).</p>
 */
@Component
@RequiredArgsConstructor
public class IssueOutilsSupport {

    public static final String PERMISSION_LECTURE = "PROJECT_READ";
    public static final int MAX_RESULTATS = 50;

    /**
     * Statuts qui cloturent une issue (nom affiche, sans casse). Le modele n'a
     * pas de drapeau « statut final » : on s'appuie sur les statuts par defaut
     * (Terminé, Abandonné). A adapter si un flux utilise d'autres noms.
     */
    private static final Set<String> STATUTS_CLOS = Set.of("terminé", "abandonné");

    private final ProjectService projectService;
    private final IssueService issueService;
    private final ToolPermissionGuard guard;
    private final AssistantAuditService audit;
    private final TransactionTemplate transactionTemplate;

    // -----------------------------------------------------------------
    // Resultats partages
    // -----------------------------------------------------------------

    public record EspaceResume(Long id, String prefixe, String nom) {
    }

    public record ProjetResume(Long id, String cle, String resume, String type, String statut,
                               String responsable, LocalDate dateDemarrage, LocalDate echeance,
                               boolean enRetard, Integer pourcentageAvancement,
                               int nbTaches, int nbTachesTerminees) {
    }

    public record TacheResume(Long id, String cle, String resume, String type, String statut,
                              String assigne, String projetCle, LocalDate dateDemarrage,
                              LocalDate echeance, boolean enRetard, Integer pourcentageAvancement) {
    }

    public record Echeance(String nature, String cle, String resume, String statut,
                           LocalDate echeance, long joursRestants) {
    }

    public record TempsUtilisateur(String utilisateur, int totalMinutes, int passeMinutes, int resteMinutes) {
    }

    public record Planning(String cle, int totalMinutes, int passeMinutes, int resteMinutes,
                           List<TempsUtilisateur> parUtilisateur) {
    }

    // -----------------------------------------------------------------
    // Acces
    // -----------------------------------------------------------------

    public <T> T enTransaction(Supplier<T> action) {
        return transactionTemplate.execute(status -> action.get());
    }

    public static String userId(ToolContext ctx) {
        return ToolPermissionGuard.userId(ctx);
    }

    public static String normaliserPrefixe(String prefixe) {
        return prefixe == null ? null : prefixe.trim().toUpperCase(Locale.ROOT);
    }

    /** Charge l'espace par son prefixe, controle le droit de lecture et journalise. */
    public Project espaceAutorise(String espaceId, String outil, ToolContext ctx) {
        String userId = userId(ctx);
        String prefixe = normaliserPrefixe(espaceId);
        guard.require(userId, PERMISSION_LECTURE, prefixe);
        Project espace = prefixe == null ? null : projectService.getByPrefix(prefixe);
        if (espace == null) {
            audit.log(userId, outil, prefixe, "introuvable", false);
            throw new IllegalArgumentException("Espace de travail introuvable : " + espaceId);
        }
        audit.log(userId, outil, prefixe, "", true);
        return espace;
    }

    /** Issue (projet ou tache) d'un espace de travail dont le droit de lecture est deja controle. */
    public Issue issueDeEspace(Project espace, String cle) {
        Issue issue = cle == null ? null : issueService.getIssue(cle.trim(), espace.getId());
        if (issue == null) {
            throw new IllegalArgumentException("Aucune issue " + cle + " dans l'espace de travail " + espace.getPrefix());
        }
        return issue;
    }

    /** Projet (issue parente) d'un espace ; refuse une tache. */
    public Issue projetDeEspace(Project espace, String cleProjet) {
        Issue issue = issueDeEspace(espace, cleProjet);
        if (issue.getParent() != null) {
            throw new IllegalArgumentException(cleProjet + " est une tâche, pas un projet");
        }
        return issue;
    }

    /** Tache (issue enfant) d'un espace ; refuse un projet. */
    public Issue tacheDeEspace(Project espace, String cleTache) {
        Issue issue = issueDeEspace(espace, cleTache);
        if (issue.getParent() == null) {
            throw new IllegalArgumentException(cleTache + " est un projet, pas une tâche");
        }
        return issue;
    }

    /** Projets d'un espace : les issues des types de niveau parent. */
    public List<Issue> projetsDeEspace(Project espace) {
        return projectService.loadIssueMasterByProject(espace.getId());
    }

    public List<Issue> tachesDeProjet(Issue projet) {
        return projet.getChildren() == null ? List.of() : projet.getChildren();
    }

    public List<Issue> tachesDeEspace(Project espace) {
        return projetsDeEspace(espace).stream()
                .flatMap(projet -> tachesDeProjet(projet).stream())
                .collect(Collectors.toList());
    }

    /** Espace auquel appartient une issue (directement, sinon par son type). */
    public Project espaceDe(Issue issue) {
        if (issue.getProject() != null) {
            return issue.getProject();
        }
        return issue.getIssueType() == null ? null : issue.getIssueType().getProject();
    }

    // -----------------------------------------------------------------
    // Etat d'une issue
    // -----------------------------------------------------------------

    public boolean estClos(Issue issue) {
        return issue.getStatus() != null && issue.getStatus().getDisplayName() != null
                && STATUTS_CLOS.contains(issue.getStatus().getDisplayName().trim().toLowerCase(Locale.ROOT));
    }

    public LocalDate echeance(Issue issue) {
        return dateChamp(issue, CustomField.CODE_DEADLINE);
    }

    public LocalDate dateDemarrage(Issue issue) {
        return dateChamp(issue, CustomField.CODE_DATE_DEMARRAGE);
    }

    private LocalDate dateChamp(Issue issue, String code) {
        if (issue.getValues() == null) {
            return null;
        }
        return issue.getValues().stream()
                .filter(valeur -> valeur instanceof DateCustomFieldValue)
                .filter(valeur -> valeur.getCustomField() != null && code.equals(valeur.getCustomField().getCode()))
                .filter(valeur -> valeur.getDate() != null)
                // getTime : la date peut etre un java.sql.Date, dont toInstant() leve une exception
                .map(valeur -> java.time.Instant.ofEpochMilli(valeur.getDate().getTime())
                        .atZone(ZoneId.systemDefault()).toLocalDate())
                .min(Comparator.naturalOrder())
                .orElse(null);
    }

    /** En retard : echeance depassee et issue non cloturee. */
    public boolean enRetard(Issue issue) {
        LocalDate echeance = echeance(issue);
        return echeance != null && echeance.isBefore(LocalDate.now()) && !estClos(issue);
    }

    public String nomStatut(Issue issue) {
        return issue.getStatus() == null || issue.getStatus().getDisplayName() == null
                ? "Sans statut" : issue.getStatus().getDisplayName();
    }

    public String nomType(Issue issue) {
        return issue.getIssueType() == null ? "Sans type" : issue.getIssueType().getName();
    }

    private String nomUtilisateur(UserApp utilisateur) {
        if (utilisateur == null) {
            return null;
        }
        return utilisateur.getFullName() != null ? utilisateur.getFullName() : utilisateur.getUsername();
    }

    public Map<String, Long> parStatut(Collection<Issue> issues) {
        return issues.stream().collect(Collectors.groupingBy(this::nomStatut, LinkedHashMap::new, Collectors.counting()));
    }

    // -----------------------------------------------------------------
    // Conversion en resultats
    // -----------------------------------------------------------------

    public EspaceResume versResume(Project espace) {
        return new EspaceResume(espace.getId(), espace.getPrefix(), espace.getName());
    }

    public ProjetResume versProjet(Issue projet) {
        List<Issue> taches = tachesDeProjet(projet);
        int terminees = (int) taches.stream().filter(this::estClos).count();
        return new ProjetResume(projet.getId(), projet.getIssueKey(), projet.getSummary(),
                nomType(projet), nomStatut(projet), nomUtilisateur(projet.getAssigne()),
                dateDemarrage(projet), echeance(projet), enRetard(projet),
                projet.getCurrentCompletionPercent(), taches.size(), terminees);
    }

    public TacheResume versTache(Issue tache) {
        return new TacheResume(tache.getId(), tache.getIssueKey(), tache.getSummary(),
                nomType(tache), nomStatut(tache), nomUtilisateur(tache.getAssigne()),
                tache.getParent() == null ? null : tache.getParent().getIssueKey(),
                dateDemarrage(tache), echeance(tache), enRetard(tache),
                tache.getCurrentCompletionPercent());
    }

    /** Taches triees par echeance (sans echeance en dernier), limitees. */
    public List<TacheResume> versTaches(Collection<Issue> taches) {
        return taches.stream()
                .sorted(Comparator.comparing(this::echeance, Comparator.nullsLast(Comparator.naturalOrder())))
                .limit(MAX_RESULTATS)
                .map(this::versTache)
                .collect(Collectors.toList());
    }

    public List<Echeance> echeancesProchaines(Collection<Issue> issues, int jours) {
        LocalDate aujourdhui = LocalDate.now();
        LocalDate limite = aujourdhui.plusDays(Math.max(jours, 0));
        List<Echeance> resultat = new ArrayList<>();
        for (Issue issue : issues) {
            LocalDate echeance = echeance(issue);
            if (echeance == null || estClos(issue) || echeance.isBefore(aujourdhui) || echeance.isAfter(limite)) {
                continue;
            }
            resultat.add(new Echeance(issue.getParent() == null ? "PROJET" : "TACHE",
                    issue.getIssueKey(), issue.getSummary(), nomStatut(issue), echeance,
                    java.time.temporal.ChronoUnit.DAYS.between(aujourdhui, echeance)));
        }
        resultat.sort(Comparator.comparing(Echeance::echeance));
        return resultat.size() > MAX_RESULTATS ? resultat.subList(0, MAX_RESULTATS) : resultat;
    }

    /** Temps planifie, passe et restant d'une issue et de ses sous-taches, par utilisateur. */
    public Planning planningDe(Issue issue) {
        var resume = issueService.getIssuePlanningSummary(issue.getId());
        List<TempsUtilisateur> parUtilisateur = resume.getUserStats() == null ? List.of()
                : resume.getUserStats().stream()
                .map(stat -> new TempsUtilisateur(nomUtilisateur(stat.getUser()), stat.getTotalMinutes(),
                        stat.getSpentMinutes(), stat.getRemainingMinutes()))
                .collect(Collectors.toList());
        return new Planning(issue.getIssueKey(),
                valeur(resume.getTotalMinutes()), valeur(resume.getSpentMinutes()),
                valeur(resume.getRemainingMinutes()), parUtilisateur);
    }

    private int valeur(Integer minutes) {
        return minutes == null ? 0 : minutes;
    }

    public void journaliser(ToolContext ctx, String outil, String cible) {
        audit.log(userId(ctx), outil, cible, "", true);
    }

    public Set<Long> idsEspacesAccessibles(String userId) {
        return projectService.getProjectByUser(userId).stream()
                .map(Project::getId)
                .collect(Collectors.toSet());
    }

    public List<Issue> issuesAssignees(String userId) {
        return issueService.findByAssigneId(userId);
    }
}