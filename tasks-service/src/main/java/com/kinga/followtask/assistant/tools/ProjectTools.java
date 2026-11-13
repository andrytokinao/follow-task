package com.kinga.followtask.assistant.tools;

import com.kinga.followtask.assistant.security.AssistantAuditService;
import com.kinga.followtask.assistant.security.ToolPermissionGuard;
import com.kinga.followtask.entity.CustomField;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.Label;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.Status;
import com.kinga.followtask.entity.WorkFlow;
import com.kinga.followtask.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Outils de l'assistant autour des espaces de travail.
 *
 * <p>Vocabulaire : l'entite {@link Project} est un « espace de travail » dans
 * l'application. Les descriptions des outils et les noms de parametres
 * l'expriment ainsi, pour que le modele n'emploie pas le mot « projet ».
 * L'identifiant d'un espace de travail est son prefixe (ex. DATA).</p>
 *
 * <p>Les outils renvoient des records plats et non les entites JPA : serialiser
 * une entite parcourt ses relations (types, flux, taches) et peut boucler.</p>
 */
@Component
@RequiredArgsConstructor
public class ProjectTools {

    private static final String PERMISSION_LECTURE = "PROJECT_READ";
    private static final int MAX_TACHES = 50;

    private final ProjectService projectService;
    private final ToolPermissionGuard guard;
    private final AssistantAuditService audit;

    // -----------------------------------------------------------------
    // Resultats
    // -----------------------------------------------------------------

    public record EspaceResume(Long id, String prefixe, String nom) {
    }

    public record TypeResume(Long id, String nom, String prefixe, String niveau, String couleur,
                             String fluxTravail, List<String> parents) {
    }

    public record StatutResume(Long id, String nom, String couleur) {
    }

    public record FluxResume(Long id, String nom, boolean commun, List<StatutResume> statuts) {
    }

    public record LabelResume(Long id, String nom, String couleur) {
    }

    public record ChampResume(Long id, String nom, String code, boolean commun) {
    }

    public record TacheResume(Long id, String cle, String type, String statut) {
    }

    public record AvancementEspace(String prefixe, String nom, int totalTaches,
                                   Map<String, Long> tachesParStatut,
                                   Map<String, Long> tachesParType) {
    }

    // -----------------------------------------------------------------
    // Espaces de travail
    // -----------------------------------------------------------------

    @Tool(description = "Liste les espaces de travail auxquels l'utilisateur a accès (identifiant, préfixe, nom)")
    public List<EspaceResume> mesEspacesDeTravail(ToolContext ctx) {
        String userId = ToolPermissionGuard.userId(ctx);
        audit.log(userId, "mesEspacesDeTravail", null, "", true);
        return projectService.getProjectByUser(userId).stream()
                .map(this::versResume)
                .collect(Collectors.toList());
    }

    @Tool(description = "Donne les informations générales d'un espace de travail à partir de son préfixe")
    public EspaceResume detailEspaceDeTravail(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            ToolContext ctx) {
        Project espace = espaceAutorise(espaceId, "detailEspaceDeTravail", ctx);
        return versResume(espace);
    }

    @Tool(description = "Donne l'avancement d'un espace de travail : nombre de tâches par statut et par type")
    public AvancementEspace avancementEspaceDeTravail(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            ToolContext ctx) {
        Project espace = espaceAutorise(espaceId, "avancementEspaceDeTravail", ctx);
        List<Issue> taches = projectService.allByProject(espace.getPrefix());

        Map<String, Long> parStatut = taches.stream()
                .collect(Collectors.groupingBy(this::nomStatut, LinkedHashMap::new, Collectors.counting()));
        Map<String, Long> parType = taches.stream()
                .collect(Collectors.groupingBy(this::nomType, LinkedHashMap::new, Collectors.counting()));

        return new AvancementEspace(espace.getPrefix(), espace.getName(), taches.size(), parStatut, parType);
    }

    // -----------------------------------------------------------------
    // Types de tache
    // -----------------------------------------------------------------

    @Tool(description = "Liste les types de tâche d'un espace de travail (types principaux et sous-types rattachés)")
    public List<TypeResume> typesDeTacheEspace(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            ToolContext ctx) {
        Project espace = espaceAutorise(espaceId, "typesDeTacheEspace", ctx);
        List<TypeResume> resultat = new ArrayList<>();
        for (IssueType principal : projectService.listIssueTypeMaster(espace.getId())) {
            resultat.add(versResume(principal));
            for (IssueType sousType : projectService.listIssueTypeSubtasks(principal.getId())) {
                resultat.add(versResume(sousType));
            }
        }
        return resultat;
    }

    @Tool(description = "Vérifie si un préfixe de type de tâche est encore disponible dans un espace de travail")
    public boolean prefixeTypeDisponible(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            @ToolParam(description = "Préfixe de type à tester (ex. BUG)") String prefixeType,
            ToolContext ctx) {
        Project espace = espaceAutorise(espaceId, "prefixeTypeDisponible", ctx);
        return projectService.isPrefixAvailable(espace.getId(), prefixeType, null);
    }

    // -----------------------------------------------------------------
    // Flux de travail, labels, champs
    // -----------------------------------------------------------------

    @Tool(description = "Liste les flux de travail visibles dans un espace de travail (propres à l'espace et communs) avec leurs statuts")
    public List<FluxResume> fluxDeTravailEspace(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            ToolContext ctx) {
        Project espace = espaceAutorise(espaceId, "fluxDeTravailEspace", ctx);
        return projectService.workFlowsByProject(espace.getId()).stream()
                .map(this::versResume)
                .collect(Collectors.toList());
    }

    @Tool(description = "Liste les labels d'un espace de travail")
    public List<LabelResume> labelsEspace(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            ToolContext ctx) {
        Project espace = espaceAutorise(espaceId, "labelsEspace", ctx);
        return projectService.getLabelByProject(espace.getId()).stream()
                .map(this::versResume)
                .collect(Collectors.toList());
    }

    @Tool(description = "Liste les champs personnalisés disponibles dans un espace de travail (propres à l'espace et communs à l'application)")
    public List<ChampResume> champsPersonnalisesEspace(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            ToolContext ctx) {
        Project espace = espaceAutorise(espaceId, "champsPersonnalisesEspace", ctx);
        return projectService.allCustomField(espace.getId()).stream()
                .map(this::versResume)
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------
    // Taches
    // -----------------------------------------------------------------

    @Tool(description = "Liste les tâches d'un espace de travail (clé, type, statut), limitée aux " + MAX_TACHES + " premières")
    public List<TacheResume> tachesEspace(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            ToolContext ctx) {
        Project espace = espaceAutorise(espaceId, "tachesEspace", ctx);
        return projectService.allByProject(espace.getPrefix()).stream()
                .limit(MAX_TACHES)
                .map(this::versResume)
                .collect(Collectors.toList());
    }

    @Tool(description = "Donne une tâche à partir de sa clé (ex. DATA-102) ; l'accès est contrôlé sur son espace de travail")
    public TacheResume tacheParCle(
            @ToolParam(description = "Clé de la tâche (ex. DATA-102)") String cleTache,
            ToolContext ctx) {
        String userId = ToolPermissionGuard.userId(ctx);
        Issue tache = projectService.getIssue(cleTache);
        if (tache == null) {
            audit.log(userId, "tacheParCle", cleTache, "introuvable", false);
            throw new IllegalArgumentException("Tâche introuvable : " + cleTache);
        }
        String prefixeEspace = tache.getIssueType() != null && tache.getIssueType().getProject() != null
                ? tache.getIssueType().getProject().getPrefix() : null;
        if (prefixeEspace == null) {
            audit.log(userId, "tacheParCle", cleTache, "espace inconnu", false);
            throw new IllegalArgumentException("Espace de travail de la tâche introuvable : " + cleTache);
        }
        guard.require(userId, PERMISSION_LECTURE, prefixeEspace);
        audit.log(userId, "tacheParCle", cleTache, "", true);
        return versResume(tache);
    }

    // -----------------------------------------------------------------
    // Utilitaires
    // -----------------------------------------------------------------

    /** Charge l'espace par son prefixe, controle le droit de lecture et journalise. */
    private Project espaceAutorise(String espaceId, String outil, ToolContext ctx) {
        String userId = ToolPermissionGuard.userId(ctx);
        guard.require(userId, PERMISSION_LECTURE, espaceId);
        Project espace = projectService.getByPrefix(espaceId);
        if (espace == null) {
            audit.log(userId, outil, espaceId, "introuvable", false);
            throw new IllegalArgumentException("Espace de travail introuvable : " + espaceId);
        }
        audit.log(userId, outil, espaceId, "", true);
        return espace;
    }

    private EspaceResume versResume(Project espace) {
        return new EspaceResume(espace.getId(), espace.getPrefix(), espace.getName());
    }

    private TypeResume versResume(IssueType type) {
        List<String> parents = type.getParents() == null ? List.of()
                : type.getParents().stream().map(IssueType::getName).filter(Objects::nonNull).collect(Collectors.toList());
        return new TypeResume(type.getId(), type.getName(), type.getPrefix(),
                type.getLevel() == null ? null : type.getLevel().name(),
                type.getColor(),
                type.getCurentWorkFlow() == null ? null : type.getCurentWorkFlow().getName(),
                parents);
    }

    private FluxResume versResume(WorkFlow flux) {
        List<StatutResume> statuts = flux.getStatuses() == null ? List.of()
                : flux.getStatuses().stream().map(this::versResume).collect(Collectors.toList());
        return new FluxResume(flux.getId(), flux.getName(), flux.isCommun(), statuts);
    }

    private StatutResume versResume(Status statut) {
        return new StatutResume(statut.getId(), statut.getDisplayName(), statut.getColor());
    }

    private LabelResume versResume(Label label) {
        return new LabelResume(label.getId(), label.getName(), label.getColor());
    }

    private ChampResume versResume(CustomField champ) {
        return new ChampResume(champ.getId(), champ.getName(), champ.getCode(), champ.isCommun());
    }

    private TacheResume versResume(Issue tache) {
        return new TacheResume(tache.getId(), tache.getIssueKey(), nomType(tache), nomStatut(tache));
    }

    private String nomType(Issue tache) {
        return tache.getIssueType() == null ? "Sans type" : tache.getIssueType().getName();
    }

    private String nomStatut(Issue tache) {
        return tache.getStatus() == null ? "Sans statut" : tache.getStatus().getDisplayName();
    }
}