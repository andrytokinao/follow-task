package com.kinga.followtask.service.messaging.impl.whatsapp;

import com.kinga.followtask.service.messaging.impl.whatsapp.raw.WhatsAppIncomingWebhook;
import com.kinga.followtask.service.messaging.impl.whatsapp.raw.WhatsAppRawMedia;
import com.kinga.followtask.service.messaging.impl.whatsapp.raw.WhatsAppRawMessage;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Convertit le webhook du gateway vers le format "raw" déjà géré par WhatsAppMapper,
 * pour réutiliser toMessageDto() sans le dupliquer.
 */
@Component
public class WhatsAppWebhookAdapter {

    public WhatsAppRawMessage toRawMessage(WhatsAppIncomingWebhook w) {
        WhatsAppRawMessage raw = new WhatsAppRawMessage();
        boolean sortant = w.sortant();

        raw.setId(w.messageId());
        raw.setDeMoi(sortant);

        // Auteur : null pour nos propres messages ; sinon auteurId, avec repli sur
        // participant (groupe) puis sur le canal (conversation privée).
        String auteur = w.auteurId();
        if (auteur == null) {
            auteur = (w.participant() != null) ? w.participant() : w.canalId();
        }
        raw.setDe(sortant ? null : auteur);

        raw.setNomExpediteur(w.nomExpediteur());
        raw.setPushName(w.nomExpediteur());
        raw.setTexte(w.texte());
        raw.setType(w.type());

        // createdAt : on préfère traiteLe (horloge du gateway) à horodatage (horloge du
        // téléphone, décalée de plusieurs secondes), sinon l'ordre question/réponse est faux.
        long epoch;
        if (w.traiteLe() != null) {
            epoch = w.traiteLe().getEpochSecond();
        } else if (w.horodatage() != null) {
            epoch = w.horodatage();
        } else {
            epoch = Instant.now().getEpochSecond();
        }
        raw.setHorodatage(epoch);

        if (w.media() != null) {
            WhatsAppRawMedia media = new WhatsAppRawMedia();
            media.setDisponible(true);
            media.setTelecharge(Boolean.TRUE.equals(w.media().telecharge()));
            media.setUrl(w.media().url());
            media.setMimetype(w.media().mimetype());
            raw.setMedia(media);
        }
        return raw;
    }
}