package com.kinga.followtask.service;

import com.kinga.followtask.dto.rapport.RapportProjetDTO;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.TypeDocument;
import com.kinga.followtask.entity.enumapp.Niveau;
import com.kinga.followtask.repository.DocumentRepository;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.IssueTypeRepository;
import com.kinga.followtask.repository.ProjectRepository;
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
import java.time.LocalDateTime;
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
    private final IssueTypeRepository issueTypeRepository;

    /** Noms des espaces de travail, triés. */
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
     * Projets en cours : demandes principales de l'espace, comme dans sa
     * liste, non terminées.
     *
     * @param departement nom de l'espace de travail, {@code null} pour tous
     * @param rapports    reçoit le rapport de chaque projet retenu, par
     *                    identifiant : il a fallu le calculer pour écarter les
     *                    projets terminés, le champ {@code rapportProjet} le
     *                    réutilise
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
