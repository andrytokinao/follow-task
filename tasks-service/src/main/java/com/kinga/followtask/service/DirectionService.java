package com.kinga.followtask.service;

import com.kinga.followtask.dto.rapport.RapportProjetDTO;
import com.kinga.followtask.dto.rapport.StatutTache;
import com.kinga.followtask.dto.rapport.SyntheseProjetDTO;
import com.kinga.followtask.dto.rapport.TacheRapportDTO;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Données du cockpit de direction, exposées en GraphQL par
 * {@code GQDirectionController}.
 *
 * <p>Aucun chiffre n'est recalculé ici : chaque projet passe par
 * {@link RapportService#genererRapport(Issue)}, de sorte que le cockpit et le
 * rapport d'un projet disent exactement la même chose — avancement, heures,
 * tâches en retard ({@code StatutTache.EN_RETARD}).</p>
 *
 * <p>Vocabulaire du modèle : un « projet » est une demande racine, un
 * « département » est l'espace de travail ({@code Project}) qui la porte.</p>
 */
@Service
@RequiredArgsConstructor
public class DirectionService {

    public static final String SANTE_BON = "BON";
    public static final String SANTE_VIGILANCE = "VIGILANCE";
    public static final String SANTE_CRITIQUE = "CRITIQUE";

    /** Écart consommation - avancement, en points, au-delà duquel un projet dérive. */
    private static final int SEUIL_DERIVE = 15;

    /** Tâches en retard à partir desquelles un projet est en difficulté. */
    private static final int SEUIL_RETARDS_CRITIQUE = 3;

    private final RapportService rapportService;
    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;

    /** Noms des espaces de travail, triés, pour le filtre du cockpit. */
    @Transactional(readOnly = true)
    public List<String> departements() {
        return projectRepository.findAll().stream()
                .map(this::nomDepartement)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();
    }

    /**
     * Projets en cours : demandes racines ayant au moins une tâche, non
     * terminées.
     *
     * @param departement nom de l'espace de travail, {@code null} pour tous
     * @param rapports    reçoit le rapport de chaque projet retenu, par
     *                    identifiant : il a fallu le calculer pour écarter les
     *                    projets terminés, les champs du projet le réutilisent
     */
    @Transactional(readOnly = true)
    public List<Issue> projets(String departement, Map<Long, RapportProjetDTO> rapports) {
        List<Issue> projets = new ArrayList<>();
        for (Project espace : projectRepository.findAll()) {
            if (StringUtils.hasText(departement) && !departement.equals(nomDepartement(espace))) {
                continue;
            }
            for (Issue racine : issueRepository.findRacinesDuProjet(espace.getId())) {
                // Une demande sans tâche n'est pas un projet, c'est une tâche
                // isolée : la compter noierait le portefeuille.
                if (CollectionUtils.isEmpty(racine.getChildren())) {
                    continue;
                }
                RapportProjetDTO rapport = rapportService.genererRapport(racine);
                // Un projet terminé n'a plus rien à piloter.
                if (rapport.avancementGlobal() >= 100) {
                    continue;
                }
                rapports.put(racine.getId(), rapport);
                projets.add(racine);
            }
        }
        return projets;
    }

    @Transactional(readOnly = true)
    public RapportProjetDTO rapport(Issue racine) {
        return rapportService.genererRapport(racine);
    }

    /**
     * Santé d'un projet.
     *
     * <ul>
     *   <li>{@code CRITIQUE} : le projet lui-même a dépassé sa fin planifiée,
     *   une tâche est bloquée, ou au moins {@value #SEUIL_RETARDS_CRITIQUE}
     *   tâches sont en retard ;</li>
     *   <li>{@code VIGILANCE} : une tâche en retard ou reportée, ou des heures
     *   consommées plus vite que l'avancement ;</li>
     *   <li>{@code BON} sinon.</li>
     * </ul>
     */
    public String sante(RapportProjetDTO rapport) {
        SyntheseProjetDTO synthese = rapport.synthese();
        boolean projetEnRetard = StatutTache.EN_RETARD.getLibelle().equals(rapport.statut());
        if (projetEnRetard
                || synthese.nombreBloquees() > 0
                || synthese.nombreEnRetard() >= SEUIL_RETARDS_CRITIQUE) {
            return SANTE_CRITIQUE;
        }
        if (synthese.nombreEnRetard() > 0
                || synthese.nombreReportees() > 0
                || derive(synthese.heuresPlanifiees(), synthese.totalHeures(), rapport.avancementGlobal())) {
            return SANTE_VIGILANCE;
        }
        return SANTE_BON;
    }

    /**
     * Tâche à surveiller : la plus en retard s'il y en a, sinon celle dont la
     * fin planifiée est la plus proche parmi les tâches non terminées.
     *
     * <p>Les tâches de {@code rapport.taches()} sont, dans l'ordre, les enfants
     * de la racine : on les relit ensemble pour disposer à la fois du statut
     * calculé par le rapport et des événements de l'entité.</p>
     */
    public Issue prochaineEcheance(Issue racine, RapportProjetDTO rapport) {
        if (CollectionUtils.isEmpty(racine.getChildren())) {
            return null;
        }
        List<Issue> enfants = racine.getChildren().stream().filter(Objects::nonNull).toList();
        List<TacheRapportDTO> lignes = rapport.taches();
        if (enfants.size() != lignes.size()) {
            return null;
        }

        LocalDateTime maintenant = LocalDateTime.now();
        Issue plusEnRetard = null;
        LocalDateTime finPlusEnRetard = null;
        Issue prochaine = null;
        LocalDateTime finProchaine = null;

        for (int i = 0; i < enfants.size(); i++) {
            StatutTache statut = lignes.get(i).statut();
            if (statut == StatutTache.TERMINE) {
                continue;
            }
            LocalDateTime fin = finPlanifiee(enfants.get(i));
            if (fin == null) {
                continue;
            }
            if (statut == StatutTache.EN_RETARD) {
                if (finPlusEnRetard == null || fin.isBefore(finPlusEnRetard)) {
                    finPlusEnRetard = fin;
                    plusEnRetard = enfants.get(i);
                }
            } else if (!fin.isBefore(maintenant) && (finProchaine == null || fin.isBefore(finProchaine))) {
                finProchaine = fin;
                prochaine = enfants.get(i);
            }
        }
        return plusEnRetard != null ? plusEnRetard : prochaine;
    }

    /** Même règle que l'échéance du rapport : la fin planifiée la plus tardive. */
    public LocalDateTime finPlanifiee(Issue issue) {
        if (issue == null || CollectionUtils.isEmpty(issue.getEvents())) {
            return null;
        }
        return issue.getEvents().stream()
                .map(PlanningEvent::getEndTime)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);
    }

    /**
     * Date de premier traitement : le début du plus ancien événement de
     * planning déjà commencé. Un événement prévu dans le futur ne compte pas,
     * la tâche n'a pas encore été traitée.
     */
    public LocalDateTime dateDebutTraitement(Issue issue) {
        if (issue == null || CollectionUtils.isEmpty(issue.getEvents())) {
            return null;
        }
        LocalDateTime maintenant = LocalDateTime.now();
        return issue.getEvents().stream()
                .map(PlanningEvent::getStartTime)
                .filter(Objects::nonNull)
                .filter(debut -> !debut.isAfter(maintenant))
                .min(Comparator.naturalOrder())
                .orElse(null);
    }

    // ------------------------------------------------------------------
    // Utilitaires
    // ------------------------------------------------------------------

    /** Les heures filent plus vite que l'avancement. */
    private boolean derive(double planifiees, double realisees, int avancement) {
        return planifiees > 0 && Math.round(100 * realisees / planifiees) - avancement > SEUIL_DERIVE;
    }

    /** Même règle que {@code RapportService} : le nom, à défaut le préfixe. */
    private String nomDepartement(Project espace) {
        if (espace == null) {
            return null;
        }
        if (StringUtils.hasText(espace.getName())) {
            return espace.getName();
        }
        return StringUtils.hasText(espace.getPrefix()) ? espace.getPrefix() : null;
    }
}
