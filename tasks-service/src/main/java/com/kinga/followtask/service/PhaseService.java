package com.kinga.followtask.service;

import com.kinga.followtask.dto.Response;
import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.Phase;
import com.kinga.followtask.repository.IssueTypeRepository;
import com.kinga.followtask.repository.PhaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

/**
 * Phases d'un espace de travail et rangement des types de tache dans ces phases.
 *
 * <p>Seul endroit ou la phase d'un type change : l'enregistrement d'un type
 * ({@link ProjectService#saveIssueType}) la conserve telle quelle.</p>
 */
@Service
@RequiredArgsConstructor
public class PhaseService {

    private final PhaseRepository phaseRepository;
    private final IssueTypeRepository issueTypeRepository;

    public List<Phase> phasesByProject(Long projectId) {
        return phaseRepository.findByProjectIdOrderByIdAsc(projectId);
    }

    /** Cree une phase, ou renomme une phase existante. */
    @Transactional
    public Phase savePhase(Phase input) {
        String name = input.getName() == null ? "" : input.getName().trim();
        if (name.isEmpty())
            throw new RuntimeException("Le nom de la phase est obligatoire.");

        Phase phase;
        if (input.getId() == null) {
            if (input.getProject() == null || input.getProject().getId() == null)
                throw new RuntimeException("La phase doit etre rattachee a un espace de travail.");
            phase = new Phase();
            phase.setProject(input.getProject());
        } else {
            phase = getPhase(input.getId());
        }

        Long phaseId = phase.getId();
        boolean nameTaken = phaseRepository.findByProjectIdOrderByIdAsc(phase.getProject().getId()).stream()
                .filter(other -> !other.getId().equals(phaseId))
                .anyMatch(other -> other.getName().equalsIgnoreCase(name));
        if (nameTaken)
            throw new RuntimeException("La phase « " + name + " » existe deja dans cet espace de travail.");

        phase.setName(name);
        return phaseRepository.save(phase);
    }

    /** Supprime la phase ; ses types sont conserves et se retrouvent sans phase. */
    @Transactional
    public Response deletePhase(Long phaseId) {
        Phase phase = getPhase(phaseId);
        List<IssueType> issueTypes = issueTypeRepository.findByPhaseId(phaseId);
        issueTypes.forEach(issueType -> issueType.setPhase(null));
        issueTypeRepository.saveAll(issueTypes);
        phaseRepository.delete(phase);

        Response response = new Response();
        response.setStatus("success");
        response.setCode("OK");
        response.setMessage("Phase " + phase.getName() + " supprimee");
        return response;
    }

    /** Range le type dans la phase ; sans phase, le type n'appartient plus a aucune. */
    @Transactional
    public IssueType setIssueTypePhase(Long issueTypeId, Long phaseId) {
        IssueType issueType = issueTypeRepository.findById(issueTypeId)
                .orElseThrow(() -> new RuntimeException("Type de tache introuvable : " + issueTypeId));
        Phase phase = phaseId == null ? null : getPhase(phaseId);
        if (phase != null && (issueType.getProject() == null
                || !Objects.equals(phase.getProject().getId(), issueType.getProject().getId())))
            throw new RuntimeException("La phase et le type n'appartiennent pas au meme espace de travail.");
        issueType.setPhase(phase);
        return issueTypeRepository.save(issueType);
    }

    private Phase getPhase(Long phaseId) {
        return phaseRepository.findById(phaseId)
                .orElseThrow(() -> new RuntimeException("Phase introuvable : " + phaseId));
    }
}
