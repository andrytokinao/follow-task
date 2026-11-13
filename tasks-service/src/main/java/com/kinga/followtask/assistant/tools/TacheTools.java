package com.kinga.followtask.assistant.tools;

import com.kinga.followtask.assistant.tools.IssueOutilsSupport.Planning;
import com.kinga.followtask.assistant.tools.IssueOutilsSupport.TacheResume;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.Project;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Outils de l'assistant sur les tâches : une tâche est une issue enfant d'un
 * projet (issue parente). Une tâche se désigne par sa clé dans son espace de travail.
 */
@Component
@RequiredArgsConstructor
public class TacheTools {

    private final IssueOutilsSupport support;

    public record DetailTache(TacheResume tache, String description) {
    }

    @Tool(description = "Liste les tâches d'un projet (clé, statut, assigné, échéance, retard, avancement), triées par échéance")
    public List<TacheResume> tachesProjet(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            @ToolParam(description = "Clé du projet (ex. DATA-12)") String cleProjet,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "tachesProjet", ctx);
            Issue projet = support.projetDeEspace(espace, cleProjet);
            return support.versTaches(support.tachesDeProjet(projet));
        });
    }

    @Tool(description = "Donne le détail d'une tâche à partir de sa clé : description, statut, assigné, projet, dates, avancement")
    public DetailTache detailTache(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            @ToolParam(description = "Clé de la tâche (ex. DATA-102)") String cleTache,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "detailTache", ctx);
            Issue tache = support.tacheDeEspace(espace, cleTache);
            return new DetailTache(support.versTache(tache), tache.getDescription());
        });
    }

    @Tool(description = "Liste les tâches assignées à l'utilisateur courant, dans les espaces de travail auxquels il a accès. Les tâches terminées sont exclues sauf demande contraire")
    public List<TacheResume> mesTaches(
            @ToolParam(description = "true pour inclure aussi les tâches terminées", required = false) Boolean inclureTerminees,
            ToolContext ctx) {
        String userId = IssueOutilsSupport.userId(ctx);
        support.journaliser(ctx, "mesTaches", null);
        return support.enTransaction(() -> {
            Set<Long> espaces = support.idsEspacesAccessibles(userId);
            boolean avecTerminees = Boolean.TRUE.equals(inclureTerminees);
            List<Issue> taches = support.issuesAssignees(userId).stream()
                    .filter(issue -> issue.getParent() != null)
                    .filter(issue -> support.espaceDe(issue) != null && espaces.contains(support.espaceDe(issue).getId()))
                    .filter(issue -> avecTerminees || !support.estClos(issue))
                    .collect(Collectors.toList());
            return support.versTaches(taches);
        });
    }

    @Tool(description = "Liste les tâches en retard d'un espace de travail : échéance dépassée et tâche non terminée")
    public List<TacheResume> tachesEnRetard(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "tachesEnRetard", ctx);
            return support.versTaches(support.tachesDeEspace(espace).stream()
                    .filter(support::enRetard)
                    .collect(Collectors.toList()));
        });
    }

    @Tool(description = "Liste les tâches d'un espace de travail qui ont un statut donné (ex. En Cours, Terminé)")
    public List<TacheResume> tachesParStatut(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            @ToolParam(description = "Nom du statut (ex. En Cours)") String statut,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "tachesParStatut", ctx);
            String cherche = statut == null ? "" : statut.trim().toLowerCase(Locale.ROOT);
            return support.versTaches(support.tachesDeEspace(espace).stream()
                    .filter(tache -> support.nomStatut(tache).toLowerCase(Locale.ROOT).equals(cherche))
                    .collect(Collectors.toList()));
        });
    }

    @Tool(description = "Donne le temps planifié, passé et restant d'une tâche, par utilisateur")
    public Planning planningTache(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            @ToolParam(description = "Clé de la tâche (ex. DATA-102)") String cleTache,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "planningTache", ctx);
            return support.planningDe(support.tacheDeEspace(espace, cleTache));
        });
    }
}