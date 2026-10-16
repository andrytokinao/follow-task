package com.kinga.tasksservice.service;

import com.kinga.followtask.dto.RappelPlanning;
import com.kinga.followtask.dto.RappelPlanning.Gravite;
import com.kinga.followtask.entity.EventType;
import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.ExecutionStatus;
import com.kinga.followtask.repository.EventRepository;
import com.kinga.followtask.service.rappel.HorairesTravail;
import com.kinga.followtask.service.rappel.PopulationOuvriers;
import com.kinga.followtask.service.rappel.RappelPlanningService;
import com.kinga.followtask.service.rappel.RedactionRappels;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Rappels de planning (DT-004). Horaires : du lundi au vendredi, 08:00-12:00 et
 * 13:00-17:00, seuil de 15 minutes. Le vendredi 16 octobre 2026, la veille
 * ouvrable est le jeudi 15 ; le lundi 19, c'est le vendredi 16.
 */
class RappelPlanningTest {

    private final EventRepository eventRepository = mock(EventRepository.class);
    private final PopulationOuvriers population = mock(PopulationOuvriers.class);
    private final HorairesTravail horaires = new HorairesTravail(
            List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY),
            List.of("08:00-12:00", "13:00-17:00"));
    private final RappelPlanningService service = new RappelPlanningService(
            eventRepository, horaires, population, new RedactionRappels(), true, 15);

    private final UserApp ouvrier = new UserApp();
    private final List<PlanningEvent> planning = new ArrayList<>();

    @BeforeEach
    void preparer() {
        ouvrier.setId("u1");
        when(population.estOuvrier(ouvrier)).thenReturn(true);
        when(eventRepository.findByUserIdChevauchant(eq("u1"), any(), any())).thenReturn(planning);
    }

    @Test
    void unChefDeProjetNeRecoitRien() {
        when(population.estOuvrier(ouvrier)).thenReturn(false);

        assertThat(service.rappelsDe(ouvrier, at(16, 10, 30))).isEmpty();
    }

    @Test
    void planningCompletNeDonneAucunRappel() {
        journeeComplete(15);
        activite(16, 8, 0, 10, 30);

        assertThat(service.rappelsDe(ouvrier, at(16, 10, 30))).isEmpty();
    }

    @Test
    void veilleIncompleteDonneLesHeuresEtLesPeriodesManquantes() {
        activite(15, 8, 0, 10, 0);
        activite(16, 8, 0, 10, 30);

        List<RappelPlanning> rappels = service.rappelsDe(ouvrier, at(16, 10, 30));

        assertThat(rappels).singleElement().satisfies(r -> {
            assertThat(r.cle()).isEqualTo("VEILLE:2026-10-15");
            assertThat(r.gravite()).isEqualTo(Gravite.ATTENTION);
            assertThat(r.titre()).startsWith("Jeudi 15 octobre");
            assertThat(r.message()).contains("2 h sur 8 h").contains("10:00–12:00, 13:00–17:00");
        });
    }

    @Test
    void veilleVideFaitApparaitreAbsent() {
        activite(16, 8, 0, 10, 30);

        RappelPlanning rappel = service.rappelsDe(ouvrier, at(16, 10, 30)).get(0);

        assertThat(rappel.gravite()).isEqualTo(Gravite.ALERTE);
        assertThat(rappel.message()).contains("absent");
    }

    @Test
    void leLundiLaVeilleEstLeVendredi() {
        activite(19, 8, 0, 9, 0);

        assertThat(service.rappelsDe(ouvrier, at(19, 9, 0)))
                .extracting(RappelPlanning::cle).containsExactly("VEILLE:2026-10-16");
    }

    @Test
    void aujourdhuiSansRienEstUneAlerte() {
        journeeComplete(15);

        RappelPlanning rappel = service.rappelsDe(ouvrier, at(16, 9, 0)).get(0);

        assertThat(rappel.cle()).isEqualTo("JOUR:2026-10-16");
        assertThat(rappel.gravite()).isEqualTo(Gravite.ALERTE);
        assertThat(rappel.message()).contains("Votre supérieur ne sait pas");
    }

    @Test
    void enDebutDeJourneeLeSeuilLaisseLeTempsDeSaisir() {
        journeeComplete(15);

        assertThat(service.rappelsDe(ouvrier, at(16, 8, 10))).isEmpty();
    }

    @Test
    void rienEnCeMomentDemandeCeQueFaitLOuvrier() {
        journeeComplete(15);
        activite(16, 8, 0, 9, 30);

        RappelPlanning rappel = service.rappelsDe(ouvrier, at(16, 10, 30)).get(0);

        assertThat(rappel.cle()).isEqualTo("JOUR:2026-10-16:09:30");
        assertThat(rappel.gravite()).isEqualTo(Gravite.ATTENTION);
        assertThat(rappel.message()).contains("depuis 09:30").contains("maintenant");
    }

    @Test
    void unTrouPasseSansTrouEnCoursEstUneInformation() {
        journeeComplete(15);
        activite(16, 8, 0, 9, 0);
        activite(16, 10, 0, 12, 0);

        RappelPlanning rappel = service.rappelsDe(ouvrier, at(16, 12, 30)).get(0);

        assertThat(rappel.gravite()).isEqualTo(Gravite.INFO);
        assertThat(rappel.message()).contains("09:00–10:00");
    }

    @Test
    void desActivitesQuiSeChevauchentNeComptentQuUneFois() {
        activite(15, 8, 0, 10, 0);
        activite(15, 9, 0, 11, 0);
        activite(16, 8, 0, 9, 0);

        assertThat(service.rappelsDe(ouvrier, at(16, 9, 0)).get(0).message()).contains("3 h sur 8 h");
    }

    @Test
    void uneActiviteReporteeNeCouvrePlusSonAncienneDate() {
        journeeComplete(15);
        activite(16, 8, 0, 11, 0).setExecutionStatus(ExecutionStatus.POSTPONED);

        assertThat(service.rappelsDe(ouvrier, at(16, 11, 0)).get(0).gravite()).isEqualTo(Gravite.ALERTE);
    }

    @Test
    void uneActiviteDeToutLaJourneeCouvreLaJournee() {
        activite(15, 0, 0, 0, 0).setAllDay(true);
        activite(16, 8, 0, 11, 0);

        assertThat(service.rappelsDe(ouvrier, at(16, 11, 0))).isEmpty();
    }

    private void journeeComplete(int jour) {
        activite(jour, 8, 0, 12, 0);
        activite(jour, 13, 0, 17, 0);
    }

    private PlanningEvent activite(int jour, int hDebut, int mDebut, int hFin, int mFin) {
        PlanningEvent e = new PlanningEvent("Activité", new EventType(), at(jour, hDebut, mDebut));
        e.setEnd(at(jour, hFin, mFin));
        planning.add(e);
        return e;
    }

    private static LocalDateTime at(int jour, int heure, int minute) {
        return LocalDateTime.of(2026, 10, jour, heure, minute);
    }
}
