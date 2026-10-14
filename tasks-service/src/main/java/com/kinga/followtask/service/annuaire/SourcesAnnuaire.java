package com.kinga.followtask.service.annuaire;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.List;

/**
 * Aiguille une référence vers la source capable de la lire.
 *
 * <p>Spring injecte toutes les {@link SourceAnnuaire} déclarées : la liste
 * s'allonge sans que cette classe change.</p>
 */
@Component
@RequiredArgsConstructor
public class SourcesAnnuaire {

    private final List<SourceAnnuaire> sources;

    public ProfilExterne lire(String reference) throws IOException {
        if (!StringUtils.hasText(reference)) {
            throw new IOException("Aucune adresse fournie.");
        }
        String propre = reference.trim();
        for (SourceAnnuaire source : sources) {
            if (source.prendEnCharge(propre)) {
                return source.lire(propre);
            }
        }
        throw new IOException("Aucun annuaire connu ne correspond à cette adresse.");
    }
}
