package com.kinga.followtask.service.rappel;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

/** Intervalle de temps [debut, fin[ : une plage de travail, ou une activite planifiee. */
public record Plage(LocalDateTime debut, LocalDateTime fin) {

    public Plage {
        if (debut == null || fin == null || fin.isBefore(debut)) {
            throw new IllegalArgumentException("Plage invalide : " + debut + " - " + fin);
        }
    }

    public long minutes() {
        return Duration.between(debut, fin).toMinutes();
    }

    public boolean contient(LocalDateTime instant) {
        return !instant.isBefore(debut) && instant.isBefore(fin);
    }

    /** Partie commune aux deux plages ; vide si elles ne se touchent pas. */
    public Optional<Plage> intersection(Plage autre) {
        LocalDateTime d = debut.isAfter(autre.debut) ? debut : autre.debut;
        LocalDateTime f = fin.isBefore(autre.fin) ? fin : autre.fin;
        return d.isBefore(f) ? Optional.of(new Plage(d, f)) : Optional.empty();
    }
}
