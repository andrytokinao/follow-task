package com.kinga.followtask.service.rappel;

import com.kinga.followtask.dto.RappelPlanning;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.EventRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Rappels de planning d'un ouvrier : le dernier jour ouvrable, puis aujourd'hui
 * jusqu'a maintenant. Rien n'est enregistre ni pousse : l'ecran les demande et
 * les affiche en toast. Un planning complete les fait disparaitre d'eux-memes.
 */
@Service
public class RappelPlanningService {

    private final EventRepository eventRepository;
    private final HorairesTravail horaires;
    private final PopulationOuvriers population;
    private final RedactionRappels redaction;
    private final boolean actif;
    private final Duration seuil;

    public RappelPlanningService(EventRepository eventRepository,
                                 HorairesTravail horaires,
                                 PopulationOuvriers population,
                                 RedactionRappels redaction,
                                 @Value("${rappel-planning.actif:true}") boolean actif,
                                 @Value("${rappel-planning.seuil-minutes:15}") long seuilMinutes) {
        this.eventRepository = eventRepository;
        this.horaires = horaires;
        this.population = population;
        this.redaction = redaction;
        this.actif = actif;
        this.seuil = Duration.ofMinutes(seuilMinutes);
    }

    @Transactional(readOnly = true)
    public List<RappelPlanning> rappelsDe(UserApp user, LocalDateTime maintenant) {
        if (!actif || !population.estOuvrier(user)) {
            return List.of();
        }
        LocalDate aujourdhui = maintenant.toLocalDate();
        Optional<LocalDate> veille = horaires.jourOuvrablePrecedent(aujourdhui);
        LocalDateTime debut = veille.orElse(aujourdhui).atStartOfDay();
        List<Plage> planifiees = PlagesPlanifiees.de(
                eventRepository.findByUserIdChevauchant(user.getId(), debut, maintenant));

        List<RappelPlanning> rappels = new ArrayList<>();
        veille.flatMap(jour -> redaction.veille(couverture(horaires.plages(jour), planifiees), jour))
                .ifPresent(rappels::add);
        List<Plage> ecoulees = horaires.plagesEcoulees(aujourdhui, maintenant);
        if (!ecoulees.isEmpty()) {
            redaction.aujourdhui(couverture(ecoulees, planifiees), maintenant).ifPresent(rappels::add);
        }
        return rappels;
    }

    private Couverture couverture(List<Plage> attendues, List<Plage> planifiees) {
        return Couverture.calculer(attendues, planifiees, seuil);
    }
}
