package com.kinga.followtask.service.rappel;

import com.kinga.followtask.dto.RappelPlanning;
import com.kinga.followtask.dto.RappelPlanning.Gravite;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Textes des rappels. Un seul rappel par journee, le plus grave : plusieurs
 * toasts sur le meme jour noieraient le message.
 *
 * Le ton est volontairement direct : le but est que le superieur sache ce que
 * fait chacun, et que l'ouvrier sache qu'un planning vide le fait passer pour absent.
 */
@Component
public class RedactionRappels {

    private static final DateTimeFormatter HEURE = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter JOUR = DateTimeFormatter.ofPattern("EEEE d MMMM", Locale.FRENCH);
    private static final int MANQUES_AFFICHES = 3;

    /** Journee en cours, calculee jusqu'a maintenant. */
    public Optional<RappelPlanning> aujourdhui(Couverture couverture, LocalDateTime maintenant) {
        if (couverture.complete()) {
            return Optional.empty();
        }
        String cle = "JOUR:" + maintenant.toLocalDate();
        if (couverture.vide()) {
            return Optional.of(new RappelPlanning(cle, Gravite.ALERTE,
                    "Aucune activité planifiée aujourd'hui",
                    "Votre supérieur ne sait pas ce que vous faites aujourd'hui. "
                            + "Sans planning, vous apparaissez absent : renseignez vos activités."));
        }
        Optional<Plage> enCours = couverture.manqueA(maintenant);
        if (enCours.isPresent()) {
            // L'heure de debut du trou entre dans la cle : un nouveau trou, plus
            // tard dans la journee, merite un nouveau rappel.
            return Optional.of(new RappelPlanning(cle + ":" + HEURE.format(enCours.get().debut()), Gravite.ATTENTION,
                    "Que faites-vous en ce moment ?",
                    "Rien n'est planifié depuis " + HEURE.format(enCours.get().debut())
                            + ". Votre supérieur ne sait pas ce que vous faites maintenant."));
        }
        return Optional.of(new RappelPlanning(cle, Gravite.INFO,
                "Planning incomplet aujourd'hui",
                "Périodes non renseignées : " + periodes(couverture.manques()) + "."));
    }

    /** Dernier jour ouvrable, journee entiere. */
    public Optional<RappelPlanning> veille(Couverture couverture, LocalDate jour) {
        if (couverture.complete()) {
            return Optional.empty();
        }
        String cle = "VEILLE:" + jour;
        String quand = majuscule(JOUR.format(jour));
        if (couverture.vide()) {
            return Optional.of(new RappelPlanning(cle, Gravite.ALERTE,
                    quand + " : aucune activité",
                    "Rien n'est enregistré pour ce jour : vous apparaissez absent. "
                            + "Complétez votre planning pour que votre supérieur sache ce que vous avez fait."));
        }
        return Optional.of(new RappelPlanning(cle, Gravite.ATTENTION,
                quand + " : planning incomplet",
                "Vous n'avez renseigné que " + duree(couverture.minutesCouvertes())
                        + " sur " + duree(couverture.minutesAttendues())
                        + ". Périodes manquantes : " + periodes(couverture.manques()) + "."));
    }

    private String periodes(List<Plage> manques) {
        String liste = manques.stream()
                .limit(MANQUES_AFFICHES)
                .map(m -> HEURE.format(m.debut()) + "–" + HEURE.format(m.fin()))
                .collect(Collectors.joining(", "));
        return manques.size() > MANQUES_AFFICHES ? liste + "…" : liste;
    }

    /** « 2 h », « 2 h 30 », « 45 min ». */
    static String duree(long minutes) {
        long heures = minutes / 60;
        long reste = minutes % 60;
        if (heures == 0) {
            return reste + " min";
        }
        return reste == 0 ? heures + " h" : heures + " h " + String.format("%02d", reste);
    }

    private static String majuscule(String texte) {
        return texte.isEmpty() ? texte : Character.toUpperCase(texte.charAt(0)) + texte.substring(1);
    }
}
