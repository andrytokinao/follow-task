package com.kinga.followtask.service;

import com.kinga.followtask.dto.PhaseSaisie;
import com.kinga.followtask.dto.Response;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.Phase;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.enumapp.Niveau;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.IssueTypeRepository;
import com.kinga.followtask.repository.PhaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Phases d'un projet (« Preliminaire », « APS », « APD »...) et rangement des
 * types de tache dans ces phases.
 *
 * <p>Une phase appartient a un espace de travail, ou a tous lorsqu'elle est
 * commune. Seul endroit ou les phases d'un type changent :
 * l'enregistrement d'un type ({@link ProjectService#saveIssueType}) les
 * conserve telles quelles.</p>
 *
 * <p>Le lien entre une phase et les statuts du projet est tenu par
 * {@link com.kinga.followtask.service.phase.PhaseStatutService}.</p>
 */
@Service
@RequiredArgsConstructor
public class PhaseService {

    private final PhaseRepository phaseRepository;
    private final IssueTypeRepository issueTypeRepository;
    private final IssueRepository issueRepository;

    /** Phases de l'espace de travail et phases communes, dans l'ordre du projet. */
    public List<Phase> phasesByProject(Long projectId) {
        return phaseRepository.findVisibles(projectId);
    }

    /**
     * Cree une phase, la renomme, ou change sa portee.
     *
     * <p>Le nom est unique parmi les phases que voit un meme espace : une
     * phase commune ne peut donc pas porter le nom d'une phase d'espace.</p>
     */
    @Transactional
    public Phase savePhase(PhaseSaisie saisie) {
        String name = saisie.getName() == null ? "" : saisie.getName().trim();
        if (name.isEmpty())
            throw new RuntimeException("Le nom de la phase est obligatoire.");

        Phase phase = saisie.getId() == null ? nouvellePhase(saisie) : getPhase(saisie.getId());
        if (saisie.getId() != null && saisie.getCommune() != null)
            changerPortee(phase, saisie);

        verifierNomLibre(phase, name);
        phase.setName(name);
        return phaseRepository.save(phase);
    }

    /**
     * Supprime la phase. Ses types sont conserves, et ses taches aussi : elles
     * se retrouvent sans phase.
     */
    @Transactional
    public Response deletePhase(Long phaseId) {
        Phase phase = getPhase(phaseId);
        List<IssueType> issueTypes = issueTypeRepository.findByPhases_Id(phaseId);
        issueTypes.forEach(issueType -> issueType.getPhases().removeIf(p -> phaseId.equals(p.getId())));
        issueTypeRepository.saveAll(issueTypes);
        List<Issue> taches = issueRepository.findByPhaseId(phaseId);
        taches.forEach(tache -> tache.setPhase(null));
        issueRepository.saveAll(taches);
        phase.getStatuses().clear();
        phaseRepository.delete(phase);

        Response response = new Response();
        response.setStatus("success");
        response.setCode("OK");
        response.setMessage("Phase " + phase.getName() + " supprimee");
        return response;
    }

    /**
     * Range les phases dans l'ordre donne, du debut a la fin du projet.
     *
     * <p>Les phases communes sont partagees : les reordonner depuis un espace
     * change aussi leur ordre dans les autres.</p>
     */
    @Transactional
    public List<Phase> ordonnerPhases(List<Long> phaseIds) {
        List<Phase> phases = new ArrayList<>();
        for (int i = 0; i < phaseIds.size(); i++) {
            Phase phase = getPhase(phaseIds.get(i));
            phase.setPosition(i + 1);
            phases.add(phase);
        }
        return phaseRepository.saveAll(phases);
    }

    /**
     * Phases dans lesquelles le type est utilise ; une liste vide le retire de
     * toutes.
     *
     * <p>Les taches deja classees gardent leur phase : ce qui a ete fait en APS
     * reste en APS, meme si le type n'y sert plus.</p>
     */
    @Transactional
    public IssueType setIssueTypePhases(Long issueTypeId, List<Long> phaseIds) {
        IssueType issueType = issueTypeRepository.findById(issueTypeId)
                .orElseThrow(() -> new RuntimeException("Type de tache introuvable : " + issueTypeId));
        Map<Long, Phase> phases = new LinkedHashMap<>();
        for (Long phaseId : phaseIds == null ? List.<Long>of() : phaseIds) {
            Phase phase = getPhase(phaseId);
            Long projectId = issueType.getProject() == null ? null : issueType.getProject().getId();
            if (projectId == null || !phase.estVisibleDans(projectId))
                throw new RuntimeException("La phase " + phase.getName()
                        + " n'est pas disponible dans l'espace de travail du type.");
            phases.put(phase.getId(), phase);
        }
        if (!phases.isEmpty() && issueType.getLevel() == Niveau.PARENT)
            throw new RuntimeException("Un type de projet ne se range pas dans une phase :"
                    + " la phase d'un projet se lit sur son statut.");
        issueType.getPhases().clear();
        issueType.getPhases().addAll(phases.values());
        return issueTypeRepository.save(issueType);
    }

    // -----------------------------------------------------------------
    // Regles internes
    // -----------------------------------------------------------------

    private Phase nouvellePhase(PhaseSaisie saisie) {
        Phase phase = new Phase();
        if (!Boolean.TRUE.equals(saisie.getCommune())) {
            if (saisie.getProject() == null || saisie.getProject().getId() == null)
                throw new RuntimeException("La phase doit etre rattachee a un espace de travail, ou commune.");
            phase.setProject(saisie.getProject());
        }
        phase.setPosition(phaseRepository.findMaxPosition() + 1);
        return phase;
    }

    /**
     * Une phase devient commune sans condition. Elle ne redevient propre a un
     * espace que si aucun autre espace ne s'en sert.
     */
    private void changerPortee(Phase phase, PhaseSaisie saisie) {
        if (saisie.getCommune()) {
            phase.setProject(null);
            return;
        }
        if (!phase.isCommune())
            return;
        Project project = saisie.getProject();
        if (project == null || project.getId() == null)
            throw new RuntimeException("Indiquez l'espace de travail auquel rattacher la phase.");
        Long projectId = project.getId();
        boolean typeAilleurs = phase.getIssueTypes().stream()
                .anyMatch(type -> type.getProject() == null || !projectId.equals(type.getProject().getId()));
        if (typeAilleurs || issueRepository.existsByPhaseIdAndProjectIdNot(phase.getId(), projectId))
            throw new RuntimeException("La phase " + phase.getName()
                    + " sert dans d'autres espaces de travail : elle doit rester commune.");
        phase.setProject(project);
    }

    private void verifierNomLibre(Phase phase, String name) {
        List<Phase> voisines = phase.isCommune()
                ? phaseRepository.findAll()
                : phaseRepository.findVisibles(phase.getProject().getId());
        boolean pris = voisines.stream()
                .filter(other -> !Objects.equals(other.getId(), phase.getId()))
                .anyMatch(other -> other.getName().equalsIgnoreCase(name));
        if (pris)
            throw new RuntimeException("La phase « " + name + " » existe deja.");
    }

    private Phase getPhase(Long phaseId) {
        return phaseRepository.findById(phaseId)
                .orElseThrow(() -> new RuntimeException("Phase introuvable : " + phaseId));
    }
}
