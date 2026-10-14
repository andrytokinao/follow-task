package com.kinga.followtask.service.annuaire;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kinga.utils.DownloadUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Adaptateur de l'annuaire du personnel ({@code si.thebest.mg/staff}).
 *
 * <p>Accepte l'adresse complète d'une fiche ou son seul identifiant. L'adresse
 * réellement appelée est toujours reconstruite à partir de la racine
 * configurée : une référence ne peut donc pas faire interroger un autre hôte
 * que l'annuaire.</p>
 */
@Component
public class StaffTheBestSource implements SourceAnnuaire {

    /** Identifiant de fiche : un UUID, ou à défaut un jeton sans « / » ni « .. ». */
    private static final Pattern IDENTIFIANT = Pattern.compile("^[A-Za-z0-9-]{8,64}$");

    /** Une fiche JSON pèse quelques kilo-octets ; au-delà, ce n'en est pas une. */
    private static final long TAILLE_MAX = 512L * 1024;

    private final String racine;
    private final ObjectMapper objectMapper;

    public StaffTheBestSource(
            @Value("${annuaire.staff.url:http://si.thebest.mg/staff/api/admin/personnels/}") String racine,
            ObjectMapper objectMapper) {
        this.racine = racine.endsWith("/") ? racine : racine + "/";
        this.objectMapper = objectMapper;
    }

    @Override
    public String code() {
        return "staff";
    }

    @Override
    public boolean prendEnCharge(String reference) {
        return identifiant(reference) != null;
    }

    @Override
    public ProfilExterne lire(String reference) throws IOException {
        String id = identifiant(reference);
        if (id == null) {
            throw new IOException("Adresse étrangère à l'annuaire du personnel : " + reference);
        }
        DownloadUtils.FichierDistant reponse = DownloadUtils.telecharger(racine + id, TAILLE_MAX);
        Personnel personnel;
        try {
            personnel = objectMapper.readValue(reponse.contenu(), Personnel.class);
        } catch (IOException e) {
            throw new IOException("Réponse de l'annuaire illisible pour " + id, e);
        }
        return new ProfilExterne(code(), personnel.id(), personnel.nom(), personnel.prenoms(),
                personnel.adresseEmail(), personnel.numeroDeTelephone(), personnel.numeroCIN(),
                personnel.adresse(), personnel.posteOccupe(), personnel.photoUrl());
    }

    /**
     * Identifiant de la fiche, ou {@code null} si la référence n'est pas de cet
     * annuaire. Le schéma est ignoré : une adresse collée en https doit être
     * reconnue même si la racine est configurée en http.
     */
    String identifiant(String reference) {
        if (reference == null) {
            return null;
        }
        String brut = reference.trim();
        String prefixe = sansSchema(racine);
        String candidat = sansSchema(brut);
        String id;
        if (candidat.toLowerCase(Locale.ROOT).startsWith(prefixe.toLowerCase(Locale.ROOT))) {
            id = candidat.substring(prefixe.length());
        } else if (brut.contains("/")) {
            return null;
        } else {
            id = brut;
        }
        id = id.replaceAll("[?#].*$", "").replaceAll("/+$", "");
        return IDENTIFIANT.matcher(id).matches() ? id : null;
    }

    private static String sansSchema(String adresse) {
        return adresse.replaceFirst("(?i)^https?://", "");
    }

    /** Réponse de l'annuaire ; les champs non repris ici sont ignorés. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record Personnel(String id, String nom, String prenoms, String numeroDeTelephone,
                     String adresseEmail, String posteOccupe, String photoUrl,
                     String adresse, String numeroCIN) {
    }
}
