package com.kinga.followtask.service.annuaire;

import java.io.IOException;

/**
 * Un annuaire externe d'où l'on peut tirer une fiche de personne.
 *
 * <p>Brancher un nouvel annuaire (RH, LDAP, autre API) revient à écrire un
 * {@code @Component} de plus qui implémente cette interface : il est repéré par
 * {@link SourcesAnnuaire} sans rien modifier d'autre.</p>
 */
public interface SourceAnnuaire {

    /** Code court, repris dans le profil pour savoir d'où il vient. */
    String code();

    /**
     * Vrai si cette source sait lire la référence : en pratique, une adresse
     * sous sa racine ou un identifiant à son format.
     */
    boolean prendEnCharge(String reference);

    /**
     * @throws IOException source injoignable, fiche absente ou réponse illisible
     */
    ProfilExterne lire(String reference) throws IOException;
}
