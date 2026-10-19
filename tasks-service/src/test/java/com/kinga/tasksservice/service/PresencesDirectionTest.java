package com.kinga.tasksservice.service;

import com.kinga.followtask.dto.situation.PresenceJourDTO;
import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.EventRepository;
import com.kinga.followtask.service.rappel.HorairesTravail;
import com.kinga.followtask.service.situation.OuvriersSuivis;
import com.kinga.followtask.service.situation.PresencesDirectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Présences du Gantt de direction : horaires 08:00-12:00 et 13:00-17:00 du
 * lundi au vendredi, seuil de 15 minutes. Le vendredi 16 octobre 2026 à 10:00,
 * la semaine du lundi 12 est passée, sauf vendredi après-midi.
 */
class PresencesDirectionTest {

    private final OuvriersSuivis ouvriersSuivis = mock(OuvriersSuivis.class);
    private final EventRepository eventRepository = mock(EventRepository.class);
    private final HorairesTravail horaires = new HorairesTravail(
            List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY),
            List.of("08:00-12:00", "13:00-17:00"));
    private final PresencesDirectionService service =
            new PresencesDirectionService(ouvriersSuivis, eventRepository, horaires, 15);

    private final UserApp complet = ouvrier("complet");
    private final UserApp partiel = ouvrier("partiel");
    private final UserApp vide = ouvrier("vide");
    private final List<PlanningEvent> planning = new ArrayList<>();
    private final LocalDateTime maintenant = LocalDateTime.of(2026, 10, 16, 10, 0);

    @BeforeEach
    void preparer() {
        when(ouvriersSuivis.de("BTP")).thenReturn(List.of(
                new OuvriersSuivis.Ouvrier(complet, List.of()),
                new OuvriersSuivis.Ouvrier(partiel, List.of()),
                new OuvriersSuivis.Ouvrier(vide, List.of())));
        when(eventRepository.findByUserIdInChevauchant(any(), any(), any())).thenReturn(planning);
    }

    @Test
    void separeAbsentsEtIncompletsJourParJour() {
        activite(complet, 15, 8, 17);
        activite(partiel, 15, 8, 10);

        List<PresenceJourDTO> jours = presences(15, 16);

        assertThat(jours).singleElement().satisfies(j -> {
            assertThat(j.ouvriers()).isEqualTo(3);
            assertThat(j.absents()).extracting(p -> p.personne().getId()).containsExactly("vide");
            assertThat(j.incomplets()).extracting(p -> p.personne().getId()).containsExactly("partiel");
        });
    }

    @Test
    void weekEndEtJoursAVenirNeComptentPas() {
        // Du samedi 10 au mardi 20 : lundi 12 à vendredi 16, rien après.
        List<PresenceJourDTO> jours = presences(10, 21);

        assertThat(jours).extracting(PresenceJourDTO::jour)
                .containsExactly(jour(12), jour(13), jour(14), jour(15), jour(16));
    }

    @Test
    void aujourdhuiSeulementJusquaMaintenant() {
        activite(complet, 16, 8, 10);

        PresenceJourDTO aujourdhui = presences(16, 17).get(0);

        assertThat(aujourdhui.absents()).extracting(p -> p.personne().getId()).containsExactlyInAnyOrder("partiel", "vide");
        assertThat(aujourdhui.incomplets()).isEmpty();
    }

    private List<PresenceJourDTO> presences(int du, int au) {
        return service.presences("BTP", jour(du), jour(au), maintenant);
    }

    private void activite(UserApp qui, int jour, int de, int a) {
        PlanningEvent e = new PlanningEvent();
        e.setUser(qui);
        e.setStart(LocalDateTime.of(2026, 10, jour, de, 0));
        e.setEnd(LocalDateTime.of(2026, 10, jour, a, 0));
        planning.add(e);
    }

    private static LocalDate jour(int jour) {
        return LocalDate.of(2026, 10, jour);
    }

    private static UserApp ouvrier(String id) {
        UserApp u = new UserApp();
        u.setId(id);
        return u;
    }
}
