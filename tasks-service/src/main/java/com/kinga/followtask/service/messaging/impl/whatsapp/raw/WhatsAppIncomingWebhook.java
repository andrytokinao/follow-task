package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;

/**
 * Webhook détaillé envoyé par le gateway WhatsApp.
 * evenement : "message.recu" (entrant) ou "message.envoye" (réponse du bot).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record WhatsAppIncomingWebhook(
        String evenement,
        String canalId,          // clé réelle de la conversation (@lid, @g.us) = canalExternalId
        Boolean deMoi,           // true pour message.envoye
        String auteurId,         // JID brut de l'auteur (participant en groupe), null si deMoi
        String expediteur,       // JID téléphone du contact (affichage / numéro), PAS la clé du canal
        String messageId,        // id WhatsApp réel = externalMessageId
        Boolean estGroupe,
        String participant,
        String nomExpediteur,
        String texte,
        String type,
        MediaInfo media,
        Long horodatage,         // secondes epoch, horloge du téléphone de l'expéditeur
        Instant traiteLe         // heure de traitement côté gateway : à utiliser pour ordonner
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MediaInfo(
            String mimetype,
            Long tailleOctets,
            String nomFichierOriginal,
            String legende,
            Boolean telecharge,
            String url
    ) {}

    public boolean sortant() {
        return Boolean.TRUE.equals(deMoi) || "message.envoye".equals(evenement);
    }

    /** Déduit du canalId (fiable même si estGroupe est mal renseigné). */
    public boolean canalGroupe() {
        return canalId != null && canalId.endsWith("@g.us");
    }
}