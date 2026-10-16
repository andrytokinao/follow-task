package com.kinga.followtask.service.rappel;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Jours ouvrables et plages de travail attendues d'un ouvrier.
 *
 * Reglage dans application.properties :
 *
 * <pre>
 * rappel-planning.jours=MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY
 * rappel-planning.plages=08:00-12:00,13:00-17:00
 * </pre>
 *
 * La pause de midi n'est pas une plage : personne n'a a la planifier.
 */
@Component
public class HorairesTravail {

    private static final Logger logger = LoggerFactory.getLogger(HorairesTravail.class);

    private final Set<DayOfWeek> jours;
    private final List<Horaire> horaires;

    /** Une plage mal ecrite arrete le demarrage : cela vaut mieux que des rappels faux. */
    public HorairesTravail(
            @Value("${rappel-planning.jours:MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY}") List<DayOfWeek> jours,
            @Value("${rappel-planning.plages:08:00-12:00,13:00-17:00}") List<String> plages) {
        this.jours = jours == null || jours.isEmpty() ? EnumSet.noneOf(DayOfWeek.class) : EnumSet.copyOf(jours);
        List<Horaire> lus = new ArrayList<>();
        for (String texte : plages == null ? List.<String>of() : plages) {
            lus.add(Horaire.lire(texte));
        }
        this.horaires = List.copyOf(lus);
        logger.info("Horaires de travail : {} les {}", plages, this.jours);
    }

    public boolean estOuvrable(LocalDate jour) {
        return jours.contains(jour.getDayOfWeek());
    }

    /** Dernier jour ouvrable avant ce jour ; vide si aucun jour n'est ouvrable. */
    public Optional<LocalDate> jourOuvrablePrecedent(LocalDate jour) {
        for (int recul = 1; recul <= 7; recul++) {
            LocalDate candidat = jour.minusDays(recul);
            if (estOuvrable(candidat)) {
                return Optional.of(candidat);
            }
        }
        return Optional.empty();
    }

    /** Plages de travail attendues ce jour-la ; aucune un jour non ouvrable. */
    public List<Plage> plages(LocalDate jour) {
        if (!estOuvrable(jour)) {
            return List.of();
        }
        return horaires.stream()
                .map(h -> new Plage(jour.atTime(h.debut()), jour.atTime(h.fin())))
                .toList();
    }

    /** Une plage du reglage, sans date : « 08:00-12:00 ». */
    private record Horaire(LocalTime debut, LocalTime fin) {

        static Horaire lire(String texte) {
            String[] bornes = texte.trim().split("-");
            try {
                if (bornes.length == 2) {
                    LocalTime debut = LocalTime.parse(bornes[0].trim());
                    LocalTime fin = LocalTime.parse(bornes[1].trim());
                    if (debut.isBefore(fin)) {
                        return new Horaire(debut, fin);
                    }
                }
            } catch (DateTimeParseException e) {
                // signale ci-dessous, avec la plage fautive
            }
            throw new IllegalStateException("rappel-planning.plages : plage invalide \"" + texte + "\", attendu HH:mm-HH:mm");
        }
    }
}
