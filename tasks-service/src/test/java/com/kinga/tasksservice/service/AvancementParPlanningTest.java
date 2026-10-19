package com.kinga.tasksservice.service;

import com.kinga.followtask.dto.ActionItemInput;
import com.kinga.followtask.entity.*;
import com.kinga.followtask.entity.enumapp.EtapeAvancement;
import com.kinga.followtask.entity.enumapp.ExecutionStatus;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.service.ActionService;
import com.kinga.followtask.service.avancement.AlignementStatutTache;
import com.kinga.followtask.service.avancement.EtapeStatutService;
import com.kinga.followtask.service.avancement.RegleAvancementParPlanning;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.kinga.followtask.entity.enumapp.EtapeAvancement.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Avancement automatique (DT-007) : le statut d'une tache suit le
 * pourcentage saisi sur ses creneaux, en avancant seulement.
 */
class AvancementParPlanningTest {

    private final RegleAvancementParPlanning regle = new RegleAvancementParPlanning();

    private final IssueRepository issueRepository = mock(IssueRepository.class);
    private final EtapeStatutService etapes = mock(EtapeStatutService.class);
    private final ActionService actionService = mock(ActionService.class);
    private final AlignementStatutTache alignement =
            new AlignementStatutTache(issueRepository, etapes, regle, actionService);

    private final Status ouvert = statut(1L, "Ouvert");
    private final Status enCours = statut(2L, "En Cours");
    private final Status corrige = statut(4L, "Corrigé");
    private final Issue tache = new Issue();

    @BeforeEach
    void preparer() {
        Project projet = new Project();
        projet.setId(1L);
        tache.setId(10L);
        tache.setProject(projet);
        tache.setParent(new Issue());
        tache.setStatus(ouvert);
        when(issueRepository.findById(10L)).thenReturn(Optional.of(tache));
        when(etapes.etapeDe(ouvert)).thenReturn(A_FAIRE);
        when(etapes.etapeDe(enCours)).thenReturn(EN_COURS);
        when(etapes.statutDuFlux(tache, EN_COURS)).thenReturn(Optional.of(enCours));
        when(etapes.statutDuFlux(tache, A_VALIDER)).thenReturn(Optional.of(corrige));
    }

    // ---- regle ----

    @Test
    void sansReleveLePlanningNeDitRien() {
        assertThat(regle.etapeVisee(List.of(creneau(1, null, ExecutionStatus.PENDING)), List.of())).isEmpty();
    }

    @Test
    void premierPourcentageMetEnCours() {
        assertThat(regle.etapeVisee(List.of(creneau(1, 20, ExecutionStatus.PENDING)), List.of()))
                .contains(EN_COURS);
    }

    @Test
    void seulLeDernierReleveCompte() {
        List<PlanningEvent> planning = List.of(creneau(1, 100, ExecutionStatus.PENDING), creneau(2, 60, ExecutionStatus.PENDING));

        assertThat(regle.etapeVisee(planning, List.of())).contains(EN_COURS);
    }

    @Test
    void centPourCentDemandeValidation() {
        assertThat(regle.etapeVisee(List.of(creneau(1, 100, ExecutionStatus.PENDING)), List.of()))
                .contains(A_VALIDER);
    }

    @Test
    void centPourCentAvecSousTacheOuverteResteEnCours() {
        assertThat(regle.etapeVisee(List.of(creneau(1, 100, ExecutionStatus.PENDING)), List.of(A_VALIDER, EN_COURS)))
                .contains(EN_COURS);
        assertThat(regle.etapeVisee(List.of(creneau(1, 100, ExecutionStatus.PENDING)), java.util.Arrays.asList(TERMINE, null)))
                .contains(EN_COURS);
    }

    @Test
    void creneauBloqueBloque() {
        assertThat(regle.etapeVisee(List.of(creneau(1, 40, ExecutionStatus.BLOCKED)), List.of()))
                .contains(BLOQUE);
    }

    @Test
    void creneauReporteIgnore() {
        List<PlanningEvent> planning = List.of(creneau(1, 30, ExecutionStatus.PENDING), creneau(2, 100, ExecutionStatus.POSTPONED));

        assertThat(regle.etapeVisee(planning, List.of())).contains(EN_COURS);
    }

    // ---- alignement ----

    @Test
    void tacheOuverteAvecPourcentagePasseEnCoursSigneeParLAuteur() {
        tache.getEvents().add(creneau(1, 20, ExecutionStatus.PENDING));

        alignement.aligner(10L, "u1");

        ArgumentCaptor<ActionItemInput> action = ArgumentCaptor.forClass(ActionItemInput.class);
        verify(actionService).saveAction(action.capture());
        assertThat(action.getValue().getActionType()).isEqualTo(ActionType.STATUS);
        assertThat(action.getValue().getStatus().getId()).isEqualTo(2L);
        assertThat(action.getValue().getActionGroupe().getUser().getId()).isEqualTo("u1");
    }

    @Test
    void tacheEnCoursACentPourCentPasseAValider() {
        tache.setStatus(enCours);
        tache.getEvents().add(creneau(1, 100, ExecutionStatus.PENDING));

        alignement.aligner(10L, "u1");

        ArgumentCaptor<ActionItemInput> action = ArgumentCaptor.forClass(ActionItemInput.class);
        verify(actionService).saveAction(action.capture());
        assertThat(action.getValue().getStatus().getId()).isEqualTo(4L);
    }

    @Test
    void jamaisDeRecul() {
        tache.setStatus(enCours);
        tache.getEvents().add(creneau(1, 0, ExecutionStatus.IN_PROGRESS));
        when(etapes.statutDuFlux(tache, EN_COURS)).thenReturn(Optional.of(enCours));

        alignement.aligner(10L, "u1");

        verify(actionService, never()).saveAction(any());
    }

    @Test
    void statutSansEtapeIntouche() {
        Status maison = statut(9L, "Chez le client");
        tache.setStatus(maison);
        tache.getEvents().add(creneau(1, 50, ExecutionStatus.PENDING));

        alignement.aligner(10L, "u1");

        verify(actionService, never()).saveAction(any());
    }

    @Test
    void projetIntouche() {
        tache.setParent(null);
        tache.setChildren(new ArrayList<>(List.of(new Issue())));
        tache.getEvents().add(creneau(1, 50, ExecutionStatus.PENDING));

        alignement.aligner(10L, "u1");

        verify(actionService, never()).saveAction(any());
    }

    @Test
    void fluxSansStatutPourLEtapeIntouche() {
        when(etapes.statutDuFlux(tache, EN_COURS)).thenReturn(Optional.empty());
        tache.getEvents().add(creneau(1, 50, ExecutionStatus.PENDING));

        alignement.aligner(10L, "u1");

        verify(actionService, never()).saveAction(any());
    }

    private static Status statut(Long id, String nom) {
        Status status = new Status();
        status.setId(id);
        status.setDisplayName(nom);
        return status;
    }

    /** Creneau du jour {@code jour} d'octobre 2026, de 8 h a 10 h. */
    private static PlanningEvent creneau(int jour, Integer pourcentage, ExecutionStatus execution) {
        PlanningEvent event = new PlanningEvent();
        event.setStart(LocalDateTime.of(2026, 10, jour, 8, 0));
        event.setEnd(LocalDateTime.of(2026, 10, jour, 10, 0));
        event.setCompletionPercentage(pourcentage);
        event.setExecutionStatus(execution);
        return event;
    }
}
