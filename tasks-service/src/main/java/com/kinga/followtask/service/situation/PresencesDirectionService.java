package com.kinga.followtask.service.situation;

import com.kinga.followtask.dto.situation.PresenceJourDTO;
import com.kinga.followtask.dto.situation.PresencePersonneDTO;
import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.repository.EventRepository;
import com.kinga.followtask.service.rappel.Couverture;
import com.kinga.followtask.service.rappel.HorairesTravail;
import com.kinga.followtask.service.rappel.Plage;
import com.kinga.followtask.service.rappel.PlagesPlanifiees;
import com.kinga.followtask.service.situation.OuvriersSuivis.Ouvrier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Qui n'a pas renseigné son planning, jour par jour, sur la période du Gantt
 * de direction.
 *
 * <p>Mêmes règles que les rappels (DT-004) et la situation du jour (DT-005) :
 * mêmes ouvriers, mêmes horaires, même seuil. Seuls les jours ouvrables passés
 * comptent, et aujourd'hui jusqu'à maintenant ; un jour à venir n'a rien à
 * reprocher. « Absent » veut dire ici « aucune activité renseignée » : congés
 * et jours fériés ne sont pas connus de l'application.</p>
 */
@Service
public class PresencesDirectionService {

    /** Une année d'échelle « mois », et un peu de marge. */
    static final int JOURS_MAX = 400;

    private final OuvriersSuivis ouvriersSuivis;
    private final EventRepository eventRepository;
    private final HorairesTravail horaires;
    private final Duration seuil;

    public PresencesDirectionService(OuvriersSuivis ouvriersSuivis,
                                     EventRepository eventRepository,
                                     HorairesTravail horaires,
                                     @Value("${rappel-planning.seuil-minutes:15}") long seuilMinutes) {
        this.ouvriersSuivis = ouvriersSuivis;
        this.eventRepository = eventRepository;
        this.horaires = horaires;
        this.seuil = Duration.ofMinutes(seuilMinutes);
    }

    /**
     * @param departement nom de l'espace de travail
     * @param debut       premier jour, inclus
     * @param fin         dernier jour, exclu
     */
    @Transactional(readOnly = true)
    public List<PresenceJourDTO> presences(String departement, LocalDate debut, LocalDate fin, LocalDateTime maintenant) {
        LocalDate aujourdhui = maintenant.toLocalDate();
        LocalDate dernier = min(min(fin.minusDays(1), aujourdhui), debut.plusDays(JOURS_MAX - 1));
        if (dernier.isBefore(debut)) {
            return List.of();
        }
        List<Ouvrier> ouvriers = ouvriersSuivis.de(departement);
        if (ouvriers.isEmpty()) {
            return List.of();
        }
        Map<String, List<Plage>> plannings = plannings(ouvriers, debut, dernier);

        List<PresenceJourDTO> jours = new ArrayList<>();
        for (LocalDate jour = debut; !jour.isAfter(dernier); jour = jour.plusDays(1)) {
            List<Plage> attendues = jour.equals(aujourdhui)
                    ? horaires.plagesEcoulees(jour, maintenant)
                    : horaires.plages(jour);
            if (attendues.isEmpty()) {
                continue;
            }
            jours.add(jour(jour, attendues, ouvriers, plannings));
        }
        return jours;
    }

    private PresenceJourDTO jour(LocalDate jour, List<Plage> attendues, List<Ouvrier> ouvriers,
                                 Map<String, List<Plage>> plannings) {
        List<PresencePersonneDTO> absents = new ArrayList<>();
        List<PresencePersonneDTO> incomplets = new ArrayList<>();
        for (Ouvrier ouvrier : ouvriers) {
            Couverture couverture = Couverture.calculer(attendues,
                    plannings.getOrDefault(ouvrier.user().getId(), List.of()), seuil);
            PresencePersonneDTO personne = new PresencePersonneDTO(ouvrier.user(),
                    couverture.minutesAttendues(), couverture.minutesCouvertes());
            if (couverture.vide()) {
                absents.add(personne);
            } else if (!couverture.complete()) {
                incomplets.add(personne);
            }
        }
        return new PresenceJourDTO(jour, ouvriers.size(), absents, incomplets);
    }

    /** Plages occupées de chaque ouvrier sur la période, en une requête. */
    private Map<String, List<Plage>> plannings(List<Ouvrier> ouvriers, LocalDate debut, LocalDate dernier) {
        List<String> ids = ouvriers.stream().map(o -> o.user().getId()).toList();
        List<PlanningEvent> evenements = eventRepository.findByUserIdInChevauchant(ids,
                debut.atStartOfDay(), dernier.plusDays(1).atStartOfDay());
        return evenements.stream().collect(Collectors.groupingBy(e -> e.getUser().getId(),
                Collectors.collectingAndThen(Collectors.toList(), PlagesPlanifiees::de)));
    }

    private static LocalDate min(LocalDate a, LocalDate b) {
        return a.isBefore(b) ? a : b;
    }
}
