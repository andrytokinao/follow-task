package com.kinga.followtask.service.avancement;

import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.Status;
import com.kinga.followtask.entity.StatusEtape;
import com.kinga.followtask.entity.WorkFlow;
import com.kinga.followtask.entity.enumapp.EtapeAvancement;
import com.kinga.followtask.repository.StatusEtapeRepository;
import com.kinga.followtask.repository.StatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Etape d'avancement des statuts (DT-007) : lecture, reglage dans l'editeur de
 * flux, et choix du statut d'un flux qui correspond a une etape.
 */
@Service
@RequiredArgsConstructor
public class EtapeStatutService {

    private final StatusEtapeRepository statusEtapeRepository;
    private final StatusRepository statusRepository;

    /** Etape du statut ; null s'il n'est rattache a aucune. */
    public EtapeAvancement etapeDe(Status status) {
        if (status == null || status.getId() == null)
            return null;
        return statusEtapeRepository.findByStatusId(status.getId())
                .map(StatusEtape::getEtape)
                .orElse(null);
    }

    /** Etapes des statuts donnes, par identifiant de statut ; les statuts sans etape sont absents. */
    public Map<Long, EtapeAvancement> etapesDe(Collection<Status> statuses) {
        Set<Long> ids = statuses.stream()
                .filter(Objects::nonNull)
                .map(Status::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ids.isEmpty())
            return Map.of();
        return statusEtapeRepository.findByStatusIdIn(ids).stream()
                .collect(Collectors.toMap(se -> se.getStatus().getId(), StatusEtape::getEtape));
    }

    /**
     * Premier statut du flux de la tache rattache a l'etape, dans l'ordre du
     * flux. Vide si le type n'a pas de flux ou si aucun statut n'y correspond.
     */
    public Optional<Status> statutDuFlux(Issue tache, EtapeAvancement etape) {
        WorkFlow flux = tache.getIssueType() == null ? null : tache.getIssueType().getCurentWorkFlow();
        if (flux == null || flux.getStatuses() == null || etape == null)
            return Optional.empty();
        Map<Long, EtapeAvancement> etapes = etapesDe(flux.getStatuses());
        return flux.getStatuses().stream()
                .filter(status -> etape == etapes.get(status.getId()))
                .findFirst();
    }

    /** Rattache le statut a l'etape, ou l'en detache si l'etape est null. */
    @Transactional
    public Status definir(Long statusId, EtapeAvancement etape) {
        Status status = statusRepository.findById(statusId)
                .orElseThrow(() -> new RuntimeException("Statut introuvable : " + statusId));
        Optional<StatusEtape> existant = statusEtapeRepository.findByStatusId(statusId);
        if (etape == null) {
            existant.ifPresent(statusEtapeRepository::delete);
            return status;
        }
        StatusEtape lien = existant.orElseGet(() -> new StatusEtape(status, etape));
        lien.setEtape(etape);
        statusEtapeRepository.save(lien);
        return status;
    }
}
