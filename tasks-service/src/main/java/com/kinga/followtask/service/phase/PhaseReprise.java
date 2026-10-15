package com.kinga.followtask.service.phase;

import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.Phase;
import com.kinga.followtask.entity.enumapp.Niveau;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.IssueTypeRepository;
import com.kinga.followtask.repository.PhaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * Reprise des donnees de la premiere version des phases, ou un type n'avait
 * qu'une phase (colonne issuetype.phase_id) et ou les taches n'en portaient
 * pas.
 *
 * <p>Jouee a chaque demarrage par {@link com.kinga.followtask.config.Initializer},
 * elle ne fait quelque chose qu'une fois : la colonne lue est videe apres
 * reprise, et seules les phases sans rang sont numerotees.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PhaseReprise {

    private final IssueTypeRepository issueTypeRepository;
    private final IssueRepository issueRepository;
    private final PhaseRepository phaseRepository;

    @Transactional
    public void reprendre() {
        reprendrePhasesDesTypes();
        numeroterPhases();
    }

    /**
     * L'ancienne phase d'un sous-type rejoint ses phases, et ses taches sans
     * phase y sont classees : c'est la que la premiere version les montrait.
     * Un type de projet n'a plus de phase (la sienne se lit sur son statut).
     */
    private void reprendrePhasesDesTypes() {
        for (IssueType type : issueTypeRepository.findByLegacyPhaseIsNotNull()) {
            Phase ancienne = type.getLegacyPhase();
            if (type.getLevel() != Niveau.PARENT) {
                boolean deja = type.getPhases().stream().anyMatch(p -> p.getId().equals(ancienne.getId()));
                if (!deja)
                    type.getPhases().add(ancienne);
                List<Issue> taches = issueRepository.findByIssueTypeIdAndPhaseIsNull(type.getId());
                taches.forEach(tache -> tache.setPhase(ancienne));
                issueRepository.saveAll(taches);
                log.info("Type {} : phase {} reprise, {} tache(s) classee(s)", type.getName(), ancienne.getName(), taches.size());
            }
            type.setLegacyPhase(null);
            issueTypeRepository.save(type);
        }
    }

    /** Les phases creees avant l'ordre des phases prennent rang dans leur ordre de creation. */
    private void numeroterPhases() {
        List<Phase> sansRang = phaseRepository.findAll().stream()
                .filter(phase -> phase.getPosition() == null)
                .sorted(Comparator.comparing(Phase::getId))
                .toList();
        int rang = phaseRepository.findMaxPosition();
        for (Phase phase : sansRang) {
            phase.setPosition(++rang);
        }
        phaseRepository.saveAll(sansRang);
    }
}
