package com.kinga.followtask.service.phase;

import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.Phase;
import com.kinga.followtask.entity.Status;
import com.kinga.followtask.repository.PhaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

/**
 * Phase courante lue sur le statut du projet : la phase liee a ce statut,
 * parmi celles de l'espace de travail du projet.
 *
 * <p>Le statut du projet suit le flux de travail de son type (Preliminaire,
 * APS, APD, DAO, Controle...) ; ses transitions disent dans quel ordre on
 * passe d'une phase a l'autre, et permettent d'y revenir.</p>
 *
 * <p>Si plusieurs phases visibles etaient liees au meme statut (une phase
 * d'espace et une phase commune, liees avant la regle d'unicite), la
 * premiere dans l'ordre du projet l'emporte.</p>
 */
@Component
@RequiredArgsConstructor
public class PhaseCouranteParStatut implements ResolveurPhaseCourante {

    private final PhaseRepository phaseRepository;

    @Override
    public Optional<Phase> phaseCourante(Issue tache) {
        Issue projet = racine(tache);
        if (projet == null || projet.getStatus() == null || projet.getStatus().getId() == null)
            return Optional.empty();
        Long projectId = projectId(projet);
        if (projectId == null)
            return Optional.empty();
        Long statusId = projet.getStatus().getId();
        return phaseRepository.findVisibles(projectId).stream()
                .filter(phase -> phase.getStatuses() != null && phase.getStatuses().stream()
                        .map(Status::getId)
                        .anyMatch(statusId::equals))
                .findFirst();
    }

    /** Demande racine ; la garde contre les cycles protege d'une donnee corrompue. */
    static Issue racine(Issue tache) {
        Issue courant = tache;
        Set<Long> vus = new HashSet<>();
        while (courant != null && courant.getParent() != null
                && (courant.getId() == null || vus.add(courant.getId()))) {
            courant = courant.getParent();
        }
        return courant;
    }

    private static Long projectId(Issue projet) {
        if (projet.getProject() != null)
            return projet.getProject().getId();
        if (projet.getIssueType() != null && projet.getIssueType().getProject() != null)
            return projet.getIssueType().getProject().getId();
        return null;
    }
}
