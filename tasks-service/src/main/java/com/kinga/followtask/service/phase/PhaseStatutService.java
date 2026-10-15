package com.kinga.followtask.service.phase;

import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.Phase;
import com.kinga.followtask.entity.Status;
import com.kinga.followtask.entity.enumapp.Niveau;
import com.kinga.followtask.repository.IssueTypeRepository;
import com.kinga.followtask.repository.PhaseRepository;
import com.kinga.followtask.repository.StatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Lien entre les phases et les statuts du projet : quand un projet prend le
 * statut « APS », sa phase courante est la phase liee a ce statut.
 *
 * <p>Un statut ne designe qu'une phase. Une phase peut en avoir plusieurs :
 * une phase commune est liee au statut correspondant de chaque flux de
 * travail qui l'utilise (un meme libelle existe une fois par flux).</p>
 */
@Service
@RequiredArgsConstructor
public class PhaseStatutService {

    private final PhaseRepository phaseRepository;
    private final StatusRepository statusRepository;
    private final IssueTypeRepository issueTypeRepository;

    /**
     * Statuts que peut prendre un projet de l'espace de travail : ceux des
     * flux de travail de ses types de projet, sans doublon, dans l'ordre des
     * flux.
     */
    @Transactional(readOnly = true)
    public List<Status> statutsProjet(Long projectId) {
        Map<Long, Status> statuts = new LinkedHashMap<>();
        for (IssueType type : issueTypeRepository.findByProjectIdAndLevel(projectId, Niveau.PARENT)) {
            if (type.getCurentWorkFlow() == null || type.getCurentWorkFlow().getStatuses() == null)
                continue;
            type.getCurentWorkFlow().getStatuses().forEach(status -> statuts.putIfAbsent(status.getId(), status));
        }
        return List.copyOf(statuts.values());
    }

    /** La phase devient la phase courante des projets qui ont ce statut. */
    @Transactional
    public Phase lierStatut(Long phaseId, Long statusId) {
        Phase phase = getPhase(phaseId);
        Status status = statusRepository.findById(statusId)
                .orElseThrow(() -> new RuntimeException("Statut introuvable : " + statusId));
        String dejaPrise = phaseRepository.findByStatuses_Id(statusId).stream()
                .filter(autre -> !Objects.equals(autre.getId(), phaseId))
                .map(Phase::getName)
                .collect(Collectors.joining(", "));
        if (!dejaPrise.isEmpty())
            throw new RuntimeException("Le statut « " + status.getDisplayName()
                    + " » designe deja la phase " + dejaPrise + ".");
        boolean present = phase.getStatuses().stream().anyMatch(s -> statusId.equals(s.getId()));
        if (!present)
            phase.getStatuses().add(status);
        return phaseRepository.save(phase);
    }

    @Transactional
    public Phase delierStatut(Long phaseId, Long statusId) {
        Phase phase = getPhase(phaseId);
        phase.getStatuses().removeIf(status -> statusId.equals(status.getId()));
        return phaseRepository.save(phase);
    }

    private Phase getPhase(Long phaseId) {
        return phaseRepository.findById(phaseId)
                .orElseThrow(() -> new RuntimeException("Phase introuvable : " + phaseId));
    }
}
