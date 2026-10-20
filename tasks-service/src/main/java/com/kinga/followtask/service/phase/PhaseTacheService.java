package com.kinga.followtask.service.phase;

import com.kinga.followtask.dto.ChoixTypeSousTache;
import com.kinga.followtask.dto.TypesSousTacheParPhase;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.Phase;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.IssueTypeRepository;
import com.kinga.followtask.repository.PhaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Phase des taches : ce que le formulaire de creation propose, et la
 * correction de la phase d'une tache existante.
 */
@Service
@RequiredArgsConstructor
public class PhaseTacheService {

    private final IssueRepository issueRepository;
    private final IssueTypeRepository issueTypeRepository;
    private final PhaseRepository phaseRepository;
    private final ResolveurPhaseCourante resolveurPhaseCourante;
    private final AffectationPhase affectationPhase;

    @Transactional(readOnly = true)
    public Optional<Phase> phaseCourante(Issue tache) {
        return resolveurPhaseCourante.phaseCourante(tache);
    }

    /**
     * Types proposables pour une nouvelle sous-tache de {@code parentIssueId}.
     *
     * <p>Les sous-types autorises sous le type du parent, a raison d'une entree
     * par phase du type. Seules les entrees de la phase courante sont
     * proposees d'office ; celles des autres phases et les types sans phase
     * restent disponibles pour les exceptions. Sans phase courante, tout est
     * propose : on ne cache rien qu'on ne sache pas situer.</p>
     */
    @Transactional(readOnly = true)
    public TypesSousTacheParPhase typesSousTache(Long parentIssueId) {
        Issue parent = issueRepository.findById(parentIssueId)
                .orElseThrow(() -> new RuntimeException("Tache parente introuvable : " + parentIssueId));
        if (parent.getIssueType() == null)
            return new TypesSousTacheParPhase(null, List.of());
        Phase courante = resolveurPhaseCourante.phaseCourante(parent).orElse(null);
        Map<Long, Integer> rangs = rangsDesPhases(parent);

        List<ChoixTypeSousTache> choix = new ArrayList<>();
        for (IssueType type : issueTypeRepository.findByParents_Id(parent.getIssueType().getId())) {
            if (type.getPhases() == null || type.getPhases().isEmpty()) {
                choix.add(new ChoixTypeSousTache(type, null, courante == null));
                continue;
            }
            for (Phase phase : type.getPhases()) {
                boolean proposee = courante == null || Objects.equals(courante.getId(), phase.getId());
                choix.add(new ChoixTypeSousTache(type, phase, proposee));
            }
        }
        choix.sort(Comparator
                .comparing((ChoixTypeSousTache c) -> c.phase() == null
                        ? Integer.MAX_VALUE : rangs.getOrDefault(c.phase().getId(), Integer.MAX_VALUE - 1))
                .thenComparing(c -> c.issueType().getName() == null ? "" : c.issueType().getName(),
                        String.CASE_INSENSITIVE_ORDER));
        return new TypesSousTacheParPhase(courante, choix);
    }

    /**
     * Phase d'une tache a creer ({@link AffectationPhase#phaseInitiale}). Le
     * parent et le type sont relus ici : l'appelant n'a souvent que leur id.
     *
     * @param parentId null pour un projet
     * @param demandee phase choisie dans le formulaire, ou null
     */
    @Transactional(readOnly = true)
    public Phase phaseInitiale(Long parentId, Long issueTypeId, Phase demandee) {
        IssueType type = issueTypeRepository.findById(issueTypeId)
                .orElseThrow(() -> new RuntimeException("Type de tache introuvable : " + issueTypeId));
        Issue parent = parentId == null ? null : issueRepository.findById(parentId).orElse(null);
        return affectationPhase.phaseInitiale(parent, type, demandee);
    }

    /**
     * Phase d'une tache existante enregistree depuis un formulaire : celle
     * qu'elle a deja. Elle ne change que par {@link #setIssuePhase} ou par un
     * changement de type ; les formulaires ne la renvoient pas.
     */
    @Transactional(readOnly = true)
    public Phase phaseActuelle(Long issueId) {
        return issueRepository.findById(issueId).map(Issue::getPhase).orElse(null);
    }

    /**
     * Reclasse une tache dans une autre phase de son type : une tache creee
     * dans la mauvaise phase, ou un travail finalement rattache ailleurs.
     */
    @Transactional
    public Issue setIssuePhase(Long issueId, Long phaseId) {
        Issue tache = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Tache introuvable : " + issueId));
        tache.setPhase(affectationPhase.verifierChoix(tache.getIssueType(), phaseId));
        tache.setUpdateDate(LocalDateTime.now());
        return issueRepository.save(tache);
    }

    /** Ordre des phases dans l'espace de travail de la tache. */
    private Map<Long, Integer> rangsDesPhases(Issue tache) {
        Long projectId = tache.getProject() != null ? tache.getProject().getId()
                : tache.getIssueType().getProject() == null ? null : tache.getIssueType().getProject().getId();
        Map<Long, Integer> rangs = new HashMap<>();
        if (projectId == null)
            return rangs;
        List<Phase> phases = phaseRepository.findVisibles(projectId);
        for (int i = 0; i < phases.size(); i++) {
            rangs.put(phases.get(i).getId(), i);
        }
        return rangs;
    }
}
