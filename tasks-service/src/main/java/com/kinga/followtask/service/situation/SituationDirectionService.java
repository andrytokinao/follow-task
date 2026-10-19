package com.kinga.followtask.service.situation;

import com.kinga.followtask.dto.situation.FiabiliteDTO;
import com.kinga.followtask.dto.situation.SituationDirectionDTO;
import com.kinga.followtask.dto.situation.SituationPersonneDTO;
import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.EventRepository;
import com.kinga.followtask.service.DirectionService;
import com.kinga.followtask.service.situation.OuvriersSuivis.Ouvrier;
import com.kinga.followtask.service.rappel.Couverture;
import com.kinga.followtask.service.rappel.HorairesTravail;
import com.kinga.followtask.service.rappel.PlagesPlanifiees;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Situation du jour de la direction (DT-005) : ou en est-on, qui fait quoi
 * maintenant, et ce que vaut ce qu'on lit.
 *
 * Calculee a chaque demande, jamais enregistree, avec les regles des rappels de
 * planning (DT-004) : memes ouvriers, memes horaires, meme seuil. Rien n'est
 * devine : sans planning, une personne est « non renseignee », pas absente.
 */
@Service
public class SituationDirectionService {

    private final OuvriersSuivis ouvriersSuivis;
    private final EventRepository eventRepository;
    private final HorairesTravail horaires;
    private final MesureFiabilite mesureFiabilite;
    private final ChiffresDirection chiffresDirection;
    private final Duration seuil;

    public SituationDirectionService(OuvriersSuivis ouvriersSuivis,
                                     EventRepository eventRepository,
                                     HorairesTravail horaires,
                                     MesureFiabilite mesureFiabilite,
                                     ChiffresDirection chiffresDirection,
                                     @Value("${rappel-planning.seuil-minutes:15}") long seuilMinutes) {
        this.ouvriersSuivis = ouvriersSuivis;
        this.eventRepository = eventRepository;
        this.horaires = horaires;
        this.mesureFiabilite = mesureFiabilite;
        this.chiffresDirection = chiffresDirection;
        this.seuil = Duration.ofMinutes(seuilMinutes);
    }

    /** @param departement nom de l'espace de travail, null pour toute la societe */
    @Transactional(readOnly = true)
    public SituationDirectionDTO situation(String departement, LocalDateTime maintenant) {
        LocalDate aujourdhui = maintenant.toLocalDate();
        Optional<LocalDate> veille = horaires.jourOuvrablePrecedent(aujourdhui);
        boolean enHoraires = horaires.enHoraires(maintenant);

        List<Ouvrier> ouvriers = ouvriersSuivis.de(departement);
        Map<String, List<PlanningEvent>> plannings = plannings(ouvriers,
                veille.orElse(aujourdhui).atStartOfDay(), aujourdhui.plusDays(1).atStartOfDay());

        List<SituationPersonneDTO> personnes = new ArrayList<>();
        List<EtatDuJour> etats = new ArrayList<>();
        List<Couverture> veilles = new ArrayList<>();
        for (Ouvrier ouvrier : ouvriers) {
            List<PlanningEvent> planning = plannings.getOrDefault(ouvrier.user().getId(), List.of());
            EtatDuJour etat = EtatDuJour.calculer(planning, horaires.plagesEcoulees(aujourdhui, maintenant),
                    enHoraires, maintenant, seuil);
            etats.add(etat);
            veille.ifPresent(jour -> veilles.add(
                    Couverture.calculer(horaires.plages(jour), PlagesPlanifiees.de(planning), seuil)));
            personnes.add(personne(ouvrier, etat));
        }
        personnes.sort(Comparator.comparing(SituationPersonneDTO::etat)
                .thenComparing(p -> nomAffiche(p.personne()), String.CASE_INSENSITIVE_ORDER));

        FiabiliteDTO fiabilite = mesureFiabilite.mesurer(etats, veilles, enHoraires);
        ChiffresDirection.Resultat projets = chiffresDirection.calculer(departement);
        return new SituationDirectionDTO(maintenant, fiabilite, projets.chiffres(), projets.aTraiter(), personnes);
    }

    /** Activites de tous les ouvriers en une requete, rangees par personne. */
    private Map<String, List<PlanningEvent>> plannings(List<Ouvrier> ouvriers, LocalDateTime debut, LocalDateTime fin) {
        if (ouvriers.isEmpty()) {
            return Map.of();
        }
        List<String> ids = ouvriers.stream().map(o -> o.user().getId()).toList();
        return eventRepository.findByUserIdInChevauchant(ids, debut, fin).stream()
                .collect(Collectors.groupingBy(e -> e.getUser().getId()));
    }

    private static SituationPersonneDTO personne(Ouvrier ouvrier, EtatDuJour etat) {
        return new SituationPersonneDTO(
                ouvrier.user(),
                departement(ouvrier, etat.activite()),
                etat.etat(),
                ActivitesSituation.versDto(etat.activite()),
                etat.rienDepuis(),
                etat.couverture().minutesAttendues(),
                etat.couverture().minutesCouvertes());
    }

    /** L'espace de l'activite en cours, a defaut le premier ou l'ouvrier est assignable. */
    private static String departement(Ouvrier ouvrier, PlanningEvent activite) {
        Project espace = ActivitesSituation.espace(activite);
        return DirectionService.nomDepartement(espace != null ? espace : ouvrier.espaces().get(0));
    }

    private static String nomAffiche(UserApp user) {
        String nom = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return nom.isEmpty() && user.getUsername() != null ? user.getUsername() : nom;
    }
}
