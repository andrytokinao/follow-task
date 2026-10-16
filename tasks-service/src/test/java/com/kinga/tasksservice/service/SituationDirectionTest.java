package com.kinga.tasksservice.service;

import com.kinga.followtask.dto.situation.FiabiliteDTO;
import com.kinga.followtask.entity.EventType;
import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.enumapp.ExecutionStatus;
import com.kinga.followtask.service.rappel.Couverture;
import com.kinga.followtask.service.rappel.HorairesTravail;
import com.kinga.followtask.service.situation.EtatDuJour;
import com.kinga.followtask.service.situation.EtatPersonne;
import com.kinga.followtask.service.situation.MesureFiabilite;
import com.kinga.followtask.service.situation.NiveauFiabilite;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Situation du jour de la direction (DT-005). Memes horaires que les rappels
 * (DT-004) : du lundi au vendredi, 08:00-12:00 et 13:00-17:00, seuil de 15
 * minutes. Le vendredi 16 octobre 2026.
 */
class SituationDirectionTest {

    private final HorairesTravail horaires = new HorairesTravail(
            List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY),
            List.of("08:00-12:00", "13:00-17:00"));
    private final MesureFiabilite mesure = new MesureFiabilite(90, 60);
    private final List<PlanningEvent> planning = new ArrayList<>();

    @Test
    void uneActiviteQuiCouvreMaintenantEstEnActivite() {
        activite(8, 0, 9, 0);
        PlanningEvent enCours = activite(9, 0, 11, 0);

        EtatDuJour etat = etatA(10, 0);

        assertThat(etat.etat()).isEqualTo(EtatPersonne.EN_ACTIVITE);
        assertThat(etat.activite()).isSameAs(enCours);
        assertThat(etat.couverture().minutesCouvertes()).isEqualTo(120);
    }

    @Test
    void uneActiviteBloqueeEstSignalee() {
        activite(8, 0, 11, 0).setExecutionStatus(ExecutionStatus.BLOCKED);

        assertThat(etatA(10, 0).etat()).isEqualTo(EtatPersonne.BLOQUE);
    }

    @Test
    void rienDeLaJourneeEstNonRenseigne() {
        EtatDuJour etat = etatA(10, 30);

        assertThat(etat.etat()).isEqualTo(EtatPersonne.NON_RENSEIGNE);
        assertThat(etat.rienDepuis()).isEqualTo(at(8, 0));
    }

    @Test
    void unTrouApresLeMatinDitDepuisQuand() {
        activite(8, 0, 9, 30);

        EtatDuJour etat = etatA(10, 30);

        assertThat(etat.etat()).isEqualTo(EtatPersonne.TROU_EN_COURS);
        assertThat(etat.rienDepuis()).isEqualTo(at(9, 30));
    }

    @Test
    void unVidePlusCourtQueLeSeuilEstUnePauseCourte() {
        activite(8, 0, 9, 50);

        assertThat(etatA(10, 0).etat()).isEqualTo(EtatPersonne.PAUSE_COURTE);
    }

    @Test
    void uneActiviteReporteeNeCouvreRien() {
        activite(8, 0, 11, 0).setExecutionStatus(ExecutionStatus.POSTPONED);

        assertThat(etatA(10, 0).etat()).isEqualTo(EtatPersonne.NON_RENSEIGNE);
    }

    @Test
    void aMidiPersonneNEstEnFaute() {
        assertThat(etatA(12, 30).etat()).isEqualTo(EtatPersonne.HORS_HORAIRES);
    }

    @Test
    void lesNiveauxSuiventLesSeuils() {
        assertThat(NiveauFiabilite.de(90, 90, 60)).isEqualTo(NiveauFiabilite.FIABLE);
        assertThat(NiveauFiabilite.de(89, 90, 60)).isEqualTo(NiveauFiabilite.PARTIELLE);
        assertThat(NiveauFiabilite.de(60, 90, 60)).isEqualTo(NiveauFiabilite.PARTIELLE);
        assertThat(NiveauFiabilite.de(59, 90, 60)).isEqualTo(NiveauFiabilite.NON_FIABLE);
    }

    @Test
    void enHorairesLaFiabiliteEstLaPartDesPlanningsAJour() {
        activite(8, 0, 11, 0);
        EtatDuJour aJour = etatA(10, 0);
        planning.clear();
        EtatDuJour vide = etatA(10, 0);

        FiabiliteDTO fiabilite = mesure.mesurer(List.of(aJour, aJour, aJour, vide), List.of(), true);

        assertThat(fiabilite.planningAJour()).isEqualTo(3);
        assertThat(fiabilite.part()).isEqualTo(75);
        assertThat(fiabilite.niveau()).isEqualTo(NiveauFiabilite.PARTIELLE);
    }

    @Test
    void horsHorairesLaFiabiliteEstLeRemplissageDeLaJournee() {
        activite(8, 0, 12, 0);
        activite(13, 0, 16, 0);
        EtatDuJour etat = etatA(18, 0);

        FiabiliteDTO fiabilite = mesure.mesurer(List.of(etat), List.<Couverture>of(), false);

        assertThat(fiabilite.remplissageJour()).isEqualTo(88);
        assertThat(fiabilite.part()).isEqualTo(88);
        assertThat(fiabilite.niveau()).isEqualTo(NiveauFiabilite.PARTIELLE);
    }

    @Test
    void sansOuvrierRienNEstMesure() {
        FiabiliteDTO fiabilite = mesure.mesurer(List.of(), List.of(), true);

        assertThat(fiabilite.part()).isNull();
        assertThat(fiabilite.niveau()).isNull();
    }

    private EtatDuJour etatA(int heure, int minute) {
        LocalDateTime maintenant = at(heure, minute);
        return EtatDuJour.calculer(planning, horaires.plagesEcoulees(maintenant.toLocalDate(), maintenant),
                horaires.enHoraires(maintenant), maintenant, Duration.ofMinutes(15));
    }

    private PlanningEvent activite(int hDebut, int mDebut, int hFin, int mFin) {
        PlanningEvent e = new PlanningEvent("activite", new EventType(), at(hDebut, mDebut));
        e.setEnd(at(hFin, mFin));
        planning.add(e);
        return e;
    }

    private static LocalDateTime at(int heure, int minute) {
        return LocalDateTime.of(2026, 10, 16, heure, minute);
    }
}
