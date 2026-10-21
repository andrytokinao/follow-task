package com.kinga.followtask.service.outil;

import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Set;

/**
 * Nettoyage et controle des saisies du menu Outils (DT-019) : espaces en
 * trop retires, longueurs bornees a celles des colonnes, liens limites au
 * web. Un message clair plutot qu'une erreur SQL de troncature.
 */
@Component
public class ValidationOutil {

    private static final Set<String> SCHEMAS_PERMIS = Set.of("http", "https");

    /** Texte obligatoire, sur une ligne (nom, titre). */
    public String libelle(String valeur, String champ, int max) {
        String nettoye = valeur == null ? "" : valeur.replaceAll("[\\p{Cntrl}\\s]+", " ").trim();
        if (nettoye.isEmpty()) {
            throw new IllegalArgumentException(champ + " est obligatoire");
        }
        return borne(nettoye, champ, max);
    }

    /** Texte facultatif ; null s'il est vide. */
    public String facultatif(String valeur, String champ, int max) {
        if (valeur == null || valeur.isBlank()) {
            return null;
        }
        return borne(valeur.trim(), champ, max);
    }

    /**
     * Lien http ou https ; null s'il est vide et facultatif. Les autres
     * schemas ({@code javascript:}, {@code file:}...) sont refuses : le lien
     * s'ouvre d'un clic chez tous les membres.
     */
    public String lien(String valeur, boolean obligatoire, int max) {
        String lien = facultatif(valeur, "Le lien", max);
        if (lien == null) {
            if (obligatoire) {
                throw new IllegalArgumentException("Le lien est obligatoire");
            }
            return null;
        }
        try {
            URI uri = new URI(lien);
            if (uri.getScheme() == null || !SCHEMAS_PERMIS.contains(uri.getScheme().toLowerCase())
                    || uri.getHost() == null || uri.getHost().isBlank()) {
                throw new IllegalArgumentException("Le lien doit commencer par http:// ou https://");
            }
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("Le lien n'est pas une adresse valide");
        }
        return lien;
    }

    private String borne(String valeur, String champ, int max) {
        if (valeur.length() > max) {
            throw new IllegalArgumentException(champ + " ne doit pas dépasser " + max + " caractères");
        }
        return valeur;
    }
}
