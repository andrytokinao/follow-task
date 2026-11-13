package com.kinga.followtask.assistant.tools;

import com.kinga.followtask.assistant.tools.IssueOutilsSupport.Echeance;
import com.kinga.followtask.assistant.tools.IssueOutilsSupport.Planning;
import com.kinga.followtask.assistant.tools.IssueOutilsSupport.ProjetResume;
import com.kinga.followtask.assistant.tools.IssueOutilsSupport.TacheResume;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.Project;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Outils de l'assistant sur les projets : un projet est une issue parente,
 * ses tâches sont ses issues enfants. Un projet se désigne par sa clé
 * (ex. DATA-12) dans son espace de travail.
 */
@Component
@RequiredArgsConstructor
public class ProjectTools {

    private static final int PROCHAINES_ECHEANCES = 5;

    private final IssueOutilsSupport support;

    public record DetailProjet(ProjetResume projet, String description) {
    }

    public record AvancementProjet(ProjetResume projet,
                                   Map<String, Long> tachesParStatut,
                                   int tachesTerminees, int tachesTotal,
                                   Integer pourcentageTachesTerminees,
                                   List<TacheResume> tachesEnRetard,
                                   List<Echeance> prochainesEcheances,
                                   Planning planning) {
    }

    @Tool(description = "Liste les projets d'un espace de travail (clé, statut, responsable, échéance, retard, avancement, nombre de tâches). Le statut est optionnel et filtre sur son nom affiché (ex. En Cours)")
    public List<ProjetResume> projetsEspace(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            @ToolParam(description = "Nom du statut pour filtrer (ex. En Cours)", required = false) String statut,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "projetsEspace", ctx);
            String cherche = statut == null ? "" : statut.trim().toLowerCase(Locale.ROOT);
            return support.projetsDeEspace(espace).stream()
                    .filter(projet -> cherche.isEmpty()
                            || support.nomStatut(projet).toLowerCase(Locale.ROOT).equals(cherche))
                    .sorted(Comparator.comparing(support::echeance, Comparator.nullsLast(Comparator.naturalOrder())))
                    .limit(IssueOutilsSupport.MAX_RESULTATS)
                    .map(support::versProjet)
                    .collect(Collectors.toList());
        });
    }

    @Tool(description = "Donne le détail d'un projet à partir de sa clé : description, statut, responsable, dates, avancement")
    public DetailProjet detailProjet(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            @ToolParam(description = "Clé du projet (ex. DATA-12)") String cleProjet,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "detailProjet", ctx);
            Issue projet = support.projetDeEspace(espace, cleProjet);
            return new DetailProjet(support.versProjet(projet), projet.getDescription());
        });
    }

    @Tool(description = "Donne l'avancement d'un projet : tâches par statut, tâches terminées, retards, prochaines échéances, temps planifié, passé et restant")
    public AvancementProjet avancementProjet(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            @ToolParam(description = "Clé du projet (ex. DATA-12)") String cleProjet,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "avancementProjet", ctx);
            Issue projet = support.projetDeEspace(espace, cleProjet);
            List<Issue> taches = support.tachesDeProjet(projet);
            int terminees = (int) taches.stream().filter(support::estClos).count();
            Integer pourcentage = taches.isEmpty() ? null : Math.round(100f * terminees / taches.size());
            List<Echeance> echeances = support.echeancesProchaines(taches, 3650);
            return new AvancementProjet(
                    support.versProjet(projet),
                    support.parStatut(taches),
                    terminees, taches.size(), pourcentage,
                    support.versTaches(taches.stream().filter(support::enRetard).collect(Collectors.toList())),
                    echeances.size() > PROCHAINES_ECHEANCES ? echeances.subList(0, PROCHAINES_ECHEANCES) : echeances,
                    support.planningDe(projet));
        });
    }

    @Tool(description = "Liste les projets en retard d'un espace de travail : échéance dépassée et projet non terminé")
    public List<ProjetResume> projetsEnRetard(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "projetsEnRetard", ctx);
            return support.projetsDeEspace(espace).stream()
                    .filter(support::enRetard)
                    .sorted(Comparator.comparing(support::echeance))
                    .limit(IssueOutilsSupport.MAX_RESULTATS)
                    .map(support::versProjet)
                    .collect(Collectors.toList());
        });
    }

    @Tool(description = "Liste les prochaines échéances (projets et tâches non terminés) d'un espace de travail dans les N prochains jours, de la plus proche à la plus lointaine")
    public List<Echeance> echeancesEspace(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            @ToolParam(description = "Nombre de jours à couvrir à partir d'aujourd'hui (ex. 7)") Integer jours,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "echeancesEspace", ctx);
            List<Issue> projets = support.projetsDeEspace(espace);
            List<Issue> toutes = projets.stream()
                    .flatMap(projet -> java.util.stream.Stream.concat(
                            java.util.stream.Stream.of(projet), support.tachesDeProjet(projet).stream()))
                    .collect(Collectors.toList());
            return support.echeancesProchaines(toutes, jours == null ? 7 : jours);
        });
    }

    @Tool(description = "Donne le temps planifié, passé et restant d'un projet (sous-tâches incluses), par utilisateur")
    public Planning planningProjet(
            @ToolParam(description = "Préfixe de l'espace de travail (ex. DATA)") String espaceId,
            @ToolParam(description = "Clé du projet (ex. DATA-12)") String cleProjet,
            ToolContext ctx) {
        return support.enTransaction(() -> {
            Project espace = support.espaceAutorise(espaceId, "planningProjet", ctx);
            return support.planningDe(support.projetDeEspace(espace, cleProjet));
        });
    }
}