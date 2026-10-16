package com.kinga.followtask.service.workflow;

import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.WorkFlow;
import com.kinga.followtask.repository.ProjectRepository;
import com.kinga.followtask.repository.WorkFlowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

/**
 * Portee d'un flux de travail : propre a un espace de travail, ou commun a
 * tous ({@link WorkFlow#isCommun()}).
 *
 * <p>Un flux commun est partage : ses statuts et transitions se modifient
 * depuis n'importe quel espace, et le changement vaut pour tous.</p>
 */
@Service
@RequiredArgsConstructor
public class WorkFlowPorteeService {

    private final WorkFlowRepository workFlowRepository;
    private final ProjectRepository projectRepository;

    /**
     * Rend le flux commun, ou le rattache a l'espace de travail donne.
     *
     * <p>Un flux devient commun sans condition. Il ne redevient propre a un
     * espace que si aucun type d'un autre espace ne l'utilise ; le flux par
     * defaut reste toujours commun.</p>
     */
    @Transactional
    public WorkFlow changerPortee(Long workFlowId, boolean commun, Long projectId) {
        WorkFlow workFlow = workFlowRepository.findById(workFlowId)
                .orElseThrow(() -> new RuntimeException("Flux de travail introuvable : " + workFlowId));
        if (commun) {
            workFlow.setProject(null);
            return workFlowRepository.save(workFlow);
        }
        if (!workFlow.isCommun())
            return workFlow;
        if (WorkFlow.NOM_PAR_DEFAUT.equals(workFlow.getName()))
            throw new RuntimeException("Le flux par defaut est donne a tous les espaces : il doit rester commun.");
        if (projectId == null)
            throw new RuntimeException("Indiquez l'espace de travail auquel rattacher le flux.");
        boolean typeAilleurs = !CollectionUtils.isEmpty(workFlow.getIssueTypes())
                && workFlow.getIssueTypes().stream()
                .anyMatch(type -> type.getProject() == null || !projectId.equals(type.getProject().getId()));
        if (typeAilleurs)
            throw new RuntimeException("Le flux " + workFlow.getName()
                    + " sert dans d'autres espaces de travail : il doit rester commun.");
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Espace de travail introuvable : " + projectId));
        workFlow.setProject(project);
        return workFlowRepository.save(workFlow);
    }

    /** Refuse un flux d'un autre espace de travail que celui du type. */
    public void verifierDisponible(WorkFlow workFlow, IssueType issueType) {
        if (workFlow == null || workFlow.isCommun())
            return;
        Long projectId = issueType.getProject() == null ? null : issueType.getProject().getId();
        if (projectId == null || !workFlow.estVisibleDans(projectId))
            throw new RuntimeException("Le flux " + workFlow.getName()
                    + " n'est pas disponible dans l'espace de travail du type.");
    }
}
