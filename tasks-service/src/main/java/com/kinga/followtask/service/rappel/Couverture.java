package com.kinga.followtask.service.rappel;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Part des heures de travail attendues couverte par le planning d'une personne.
 *
 * Les activites qui se chevauchent ne comptent qu'une fois : deux taches
 * planifiees en parallele de 9 h a 10 h font une heure, pas deux. Une periode
 * vide plus courte que le seuil n'est pas un manque : quelques minutes entre
 * deux taches, ou le temps d'ouvrir l'application le matin.
 */
public record Couverture(long minutesAttendues, long minutesCouvertes, List<Plage> manques) {

    public static Couverture calculer(List<Plage> attendues, List<Plage> planifiees, Duration seuil) {
        List<Plage> fusionnees = fusionner(planifiees);
        long attendu = 0;
        long couvert = 0;
        List<Plage> manques = new ArrayList<>();
        for (Plage plage : attendues) {
            attendu += plage.minutes();
            LocalDateTime curseur = plage.debut();
            for (Plage activite : fusionnees) {
                var commune = plage.intersection(activite);
                if (commune.isEmpty()) {
                    continue;
                }
                couvert += commune.get().minutes();
                ajouterManque(manques, curseur, commune.get().debut(), seuil);
                curseur = commune.get().fin();
            }
            ajouterManque(manques, curseur, plage.fin(), seuil);
        }
        return new Couverture(attendu, couvert, List.copyOf(manques));
    }

    public boolean vide() {
        return minutesCouvertes == 0;
    }

    public boolean complete() {
        return manques.isEmpty();
    }

    /**
     * Le manque en cours a cet instant, s'il y en a un. Une journee en cours est
     * calculee jusqu'a maintenant : son dernier manque finit alors a l'instant meme.
     */
    public Optional<Plage> manqueA(LocalDateTime instant) {
        return manques.stream().filter(m -> m.contient(instant) || m.fin().equals(instant)).findFirst();
    }

    private static void ajouterManque(List<Plage> manques, LocalDateTime debut, LocalDateTime fin, Duration seuil) {
        if (debut.isBefore(fin) && Duration.between(debut, fin).compareTo(seuil) >= 0) {
            manques.add(new Plage(debut, fin));
        }
    }

    /** Triees et sans chevauchement. */
    private static List<Plage> fusionner(List<Plage> plages) {
        List<Plage> triees = plages.stream().sorted(Comparator.comparing(Plage::debut)).toList();
        List<Plage> resultat = new ArrayList<>();
        for (Plage plage : triees) {
            if (!resultat.isEmpty() && !plage.debut().isAfter(resultat.get(resultat.size() - 1).fin())) {
                Plage derniere = resultat.remove(resultat.size() - 1);
                LocalDateTime fin = plage.fin().isAfter(derniere.fin()) ? plage.fin() : derniere.fin();
                resultat.add(new Plage(derniere.debut(), fin));
            } else {
                resultat.add(plage);
            }
        }
        return resultat;
    }
}
