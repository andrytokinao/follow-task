package com.kinga.followtask.service;

import com.kinga.followtask.config.StatutsFinaux;
import com.kinga.followtask.dto.DependanceTacheDTO;
import com.kinga.followtask.dto.EspaceDirectionDTO;
import com.kinga.followtask.dto.PlageMembreDTO;
import com.kinga.followtask.dto.RealisationTacheDTO;
import com.kinga.followtask.dto.rapport.RapportProjetDTO;
import com.kinga.followtask.entity.CustomField;
import com.kinga.followtask.entity.CustomFieldValue;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.TypeDocument;
import com.kinga.followtask.entity.enumapp.Niveau;
import com.kinga.followtask.repository.DocumentRepository;
import com.kinga.followtask.repository.EventRepository;
import com.kinga.followtask.repository.IssueLinkRepository;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.IssueTypeRepository;
import com.kinga.followtask.repository.ProjectRepository;
import com.kinga.followtask.service.rappel.PlagesPlanifiees;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;

/**
 * Données du cockpit de direction, exposées en GraphQL par
 * {@code GQDirectionController}.
 *
 * <p>Aucun chiffre n'est recalculé ici : chaque projet passe par
 * {@link RapportService#genererRapport(Issue)}, de sorte que le cockpit et le
 * rapport d'un projet disent exactement la même chose.</p>
 *
 * <p>Vocabulaire du modèle : un « projet » est une demande racine, un
 * « département » est l'espace de travail ({@code Project}) qui la porte.</p>
 */
@Service
@RequiredArgsConstructor
public class DirectionService {

    private final RapportService rapportService;
    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final DocumentRepository documentRepository;
    private final IssueLinkRepository issueLinkRepository;
    private final IssueTypeRepository issueTypeRepository;
    private final StatutsFinaux statutsFinaux;
    private final EventRepository eventRepository;

    /** Type des événements qui portent une date de champ personnalisé : pas du travail. */
    private static final String TYPE_CHAMP = "CUSTOM_FIELD";

    /** Noms des espaces de travail, triés. */
    @Transactional(readOnly = true)
    public List<String> departements() {
        return projectRepository.findAll().stream()
                .map(DirectionService::nomDepartement)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();
    }

    /**
     * Espaces de travail avec leur préfixe, triés par nom : le cockpit en
     * choisit toujours un, désigné dans l'adresse par son préfixe.
     */
    @Transactional(readOnly = true)
    public List<EspaceDirectionDTO> espaces() {
        return projectRepository.findAll().stream()
                .filter(espace -> nomDepartement(espace) != null && StringUtils.hasText(espace.getPrefix()))
                .map(espace -> new EspaceDirectionDTO(nomDepartement(espace), espace.getPrefix()))
                .sorted(Comparator.comparing(EspaceDirectionDTO::nom, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    /**
     * Projets en cours : demandes principales de l'espace, comme dans sa
     * liste, dont le statut n'est pas final ({@link StatutsFinaux}).
     *
     * @param departement nom de l'espace de travail, {@code null} pour tous
     * @param rapports    reçoit le rapport de chaque projet retenu, par
     *                    identifiant : le champ {@code rapportProjet} le
     *                    réutilise au lieu de le recalculer
     */
    @Transactional(readOnly = true)
    public List<Issue> projets(String departement, Map<Long, RapportProjetDTO> rapports) {
        List<Issue> projets = new ArrayList<>();
        for (Project espace : projectRepository.findAll()) {
            if (StringUtils.hasText(departement) && !departement.equals(nomDepartement(espace))) {
                continue;
            }
            // Même source que la liste de l'espace de travail
            // (ProjectService.loadIssueMasterByProject) : les demandes dont le
            // type est un type principal (PARENT) de l'espace.
            List<IssueType> typesPrincipaux = issueTypeRepository.findByProjectIdAndLevel(espace.getId(), Niveau.PARENT);
            if (CollectionUtils.isEmpty(typesPrincipaux)) {
                continue;
            }
            for (Issue racine : issueRepository.findByIssueTypeIn(typesPrincipaux)) {
                // Un projet terminé n'a plus rien à piloter. On en juge par son
                // statut, comme l'espace de travail : des tâches à 100 % ne
                // ferment pas un projet resté « En attente ».
                if (statutsFinaux.estStatutFinal(racine.getStatus())) {
                    continue;
                }
                RapportProjetDTO rapport = rapportService.genererRapport(racine);
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

    /**
     * Temps occupé par les séances de ces personnes qui chevauchent la période,
     * avec la règle des rappels (DT-004) : une séance sans fin compte, celle
     * qui déborde de la période aussi ; une séance reportée, ou une date de
     * champ personnalisé, ne compte pas.
     */
    @Transactional(readOnly = true)
    public List<PlageMembreDTO> plagesMembres(List<String> userIds, LocalDateTime debut, LocalDateTime fin) {
        if (CollectionUtils.isEmpty(userIds)) {
            return List.of();
        }
        return eventRepository.findByUserIdInChevauchant(userIds, debut, fin).stream()
                .filter(e -> e.getUser() != null)
                .filter(e -> e.getEventType() == null || !TYPE_CHAMP.equalsIgnoreCase(e.getEventType().getName()))
                .flatMap(e -> PlagesPlanifiees.plageDe(e).stream()
                        .map(plage -> new PlageMembreDTO(e.getUser().getId(), plage.debut(), plage.fin())))
                .toList();
    }

    /**
     * Début d'exécution prévu ou réel : le début du plus ancien événement de
     * planning, passé ou à venir. Le Gantt de direction range les tâches dans
     * cet ordre ; null si la tâche n'a aucun événement.
     */
    public LocalDateTime debutExecution(Issue issue) {
        if (issue == null || CollectionUtils.isEmpty(issue.getEvents())) {
            return null;
        }
        return issue.getEvents().stream()
                .map(PlanningEvent::getStartTime)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder())
                .orElse(null);
    }

    /**
     * Date portée par un champ fourni par l'application
     * ({@link CustomField#CODE_DATE_DEMARRAGE}, {@link CustomField#CODE_DEADLINE}).
     * Le champ est retrouvé par son code : il peut avoir été renommé.
     *
     * @return null si la tâche n'a pas de valeur pour ce champ
     */
    @Transactional(readOnly = true)
    public LocalDateTime dateChamp(Issue issue, String code) {
        if (issue == null || CollectionUtils.isEmpty(issue.getValues())) {
            return null;
        }
        return issue.getValues().stream()
                .filter(valeur -> valeur.getCustomField() != null && code.equals(valeur.getCustomField().getCode()))
                .map(CustomFieldValue::getDate)
                .filter(Objects::nonNull)
                .findFirst()
                .map(date -> LocalDateTime.ofInstant(Instant.ofEpochMilli(date.getTime()), ZoneId.systemDefault()))
                .orElse(null);
    }

    /**
     * Réalisation d'une tâche : ses événements de planning, du plus ancien au
     * plus récent. Ce sont les séances de travail prévues ou faites, avec
     * l'avancement déclaré à chacune : la matière du diagramme de Gantt.
     *
     * <p>Les événements {@code CUSTOM_FIELD} sont écartés, comme dans le
     * planning : ce sont des dates de champ personnalisé, pas du travail.</p>
     */
    @Transactional(readOnly = true)
    public List<RealisationTacheDTO> realisations(Issue issue) {
        if (issue == null || CollectionUtils.isEmpty(issue.getEvents())) {
            return List.of();
        }
        return issue.getEvents().stream()
                .filter(event -> event.getStartTime() != null)
                .filter(event -> event.getEventType() == null
                        || !"CUSTOM_FIELD".equalsIgnoreCase(event.getEventType().getName()))
                .sorted(Comparator.comparing(PlanningEvent::getStartTime))
                .map(event -> new RealisationTacheDTO(
                        event.getId(),
                        event.getTitle(),
                        event.getStartTime(),
                        event.getEndTime(),
                        event.getCompletionPercentage(),
                        event.getExecutionStatus() == null ? null : event.getExecutionStatus().name(),
                        event.getUser()))
                .toList();
    }

    /**
     * Dépendances partant d'une tâche : les liens actifs qui ordonnent deux
     * tâches dans le temps ({@link com.kinga.followtask.entity.LinkType#isDependency()}).
     * Une simple référence ne dit rien du planning, elle n'est pas reprise.
     */
    @Transactional(readOnly = true)
    public List<DependanceTacheDTO> dependances(Issue issue) {
        if (issue == null || issue.getId() == null) {
            return List.of();
        }
        return issueLinkRepository.findBySourceIdAndRemovedAtIsNull(issue.getId()).stream()
                .filter(lien -> lien.getType() != null && lien.getType().isDependency())
                .map(lien -> new DependanceTacheDTO(
                        lien.getId(),
                        lien.getType().name(),
                        lien.getType().getOutwardLabel(),
                        lien.getDestination().getId()))
                .toList();
    }

    /**
     * Nombre de commentaires d'une demande : les documents
     * {@code COMMENT_FILES} non supprimés, comme dans l'espace de travail.
     */
    @Transactional(readOnly = true)
    public long nombreCommentaires(Issue issue) {
        return documentRepository.countByIssuesIdAndTypeDocumentAndDeleted(issue.getId(), TypeDocument.COMMENT_FILES, false);
    }

    /**
     * Nombre de pièces jointes d'une demande : les fichiers de son répertoire,
     * sous-dossiers compris, tels que les montre l'explorateur de fichiers.
     */
    public long nombrePiecesJointes(Issue issue) {
        if (issue == null || !StringUtils.hasText(issue.getDirectory())) {
            return 0;
        }
        Path racine = Paths.get(issue.getDirectory());
        if (!Files.isDirectory(racine)) {
            return 0;
        }
        try (Stream<Path> chemins = Files.walk(racine)) {
            return chemins.filter(Files::isRegularFile).count();
        } catch (IOException | UncheckedIOException e) {
            return 0;
        }
    }

    /** Même règle que {@code RapportService} : le nom, à défaut le préfixe. */
    public static String nomDepartement(Project espace) {
        if (espace == null) {
            return null;
        }
        if (StringUtils.hasText(espace.getName())) {
            return espace.getName();
        }
        return StringUtils.hasText(espace.getPrefix()) ? espace.getPrefix() : null;
    }
}
