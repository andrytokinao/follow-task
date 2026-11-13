package com.kinga.followtask.assistant.tools;

import com.kinga.followtask.assistant.tools.IssueOutilsSupport.EspaceResume;
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
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Outils de l'assistant sur les espaces de travail (entite {@link Project}) et
 * leur configuration : types, flux de travail, labels, champs personnalises.
 * Les projets et les taches (issues) sont dans ProjetTools et TacheTools.
 */
@Component
@RequiredArgsConstructor
public class EspaceTravailTools {

    private final ProjectService projectService;
    private final IssueOutilsSupport support;

    public record AvancementEspace(String prefixe, String nom,
                                   int nbProjets, Map<String, Long> projetsParStatut, int projetsEnRetard,
                                   int nbTaches, Map<String, Long> tachesParStatut, int tachesEnRetard) {
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

    @Tool(description = "Liste les espaces de travail auxquels l'utilisateur a accès (identifiant, préfixe, nom)")
    public List<EspaceResume> mesEspacesDeTravail(ToolContext ctx) {
        String userId = IssueOutilsSupport.userId(ctx);
        support.journaliser(ctx, "mesEspacesDeTravail", null);
        return support.enTransaction(() -> projectService.getProjectByUser(userId).stream()
                .map(support::versResume)
                .collect(Collectors.toList()));
    }

    @Tool(description = "Donne les informations générales d'un espace de travail à partir de son préfixe")
    public EspaceResume detailEspaceDeTravail(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            ToolContext ctx) {
        return support.enTransaction(() ->
                support.versResume(support.espaceAutorise(espaceId, "detailEspaceDeTravail", ctx)));
    }

    @Tool(description = "Donne l'avancement global d'un espace de travail : nombre de projets et de tâches par statut, projets et tâches en retard")
    public AvancementEspace avancementEspaceDeTravail(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "avancementEspaceDeTravail", ctx);
            List<Issue> projets = support.projetsDeEspace(espace);
            List<Issue> taches = projets.stream()
                    .flatMap(projet -> support.tachesDeProjet(projet).stream())
                    .collect(Collectors.toList());
            return new AvancementEspace(espace.getPrefix(), espace.getName(),
                    projets.size(), support.parStatut(projets), (int) projets.stream().filter(support::enRetard).count(),
                    taches.size(), support.parStatut(taches), (int) taches.stream().filter(support::enRetard).count());
        });
    }

    @Tool(description = "Liste les types de projet et de tâche d'un espace de travail (types principaux et sous-types rattachés)")
    public List<TypeResume> typesEspace(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "typesEspace", ctx);
            List<TypeResume> resultat = new ArrayList<>();
            for (IssueType principal : projectService.listIssueTypeMaster(espace.getId())) {
                resultat.add(versResume(principal));
                for (IssueType sousType : projectService.listIssueTypeSubtasks(principal.getId())) {
                    resultat.add(versResume(sousType));
                }
            }
            return resultat;
        });
    }

    @Tool(description = "Vérifie si un préfixe de type est encore disponible dans un espace de travail")
    public boolean prefixeTypeDisponible(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            @ToolParam(description = "Préfixe de type à tester (ex. BUG)") String prefixeType,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "prefixeTypeDisponible", ctx);
            return projectService.isPrefixAvailable(espace.getId(), prefixeType, null);
        });
    }

    @Tool(description = "Liste les flux de travail visibles dans un espace de travail (propres à l'espace et communs) avec leurs statuts")
    public List<FluxResume> fluxDeTravailEspace(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "fluxDeTravailEspace", ctx);
            return projectService.workFlowsByProject(espace.getId()).stream()
                    .map(this::versResume)
                    .collect(Collectors.toList());
        });
    }

    @Tool(description = "Liste les labels d'un espace de travail")
    public List<LabelResume> labelsEspace(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "labelsEspace", ctx);
            return projectService.getLabelByProject(espace.getId()).stream()
                    .map(this::versResume)
                    .collect(Collectors.toList());
        });
    }

    @Tool(description = "Liste les champs personnalisés disponibles dans un espace de travail (propres à l'espace et communs à l'application)")
    public List<ChampResume> champsPersonnalisesEspace(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "champsPersonnalisesEspace", ctx);
            return projectService.allCustomField(espace.getId()).stream()
                    .map(this::versResume)
                    .collect(Collectors.toList());
        });
    }

    // -----------------------------------------------------------------

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
}