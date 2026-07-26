package com.kinga.followtask.service.messaging.impl.whatsapp;

import com.kinga.followtask.entity.TypeCanal;
import com.kinga.followtask.service.messaging.dto.AttachmentDto;
import com.kinga.followtask.service.messaging.dto.CanalDto;
import com.kinga.followtask.service.messaging.dto.MediaType;
import com.kinga.followtask.service.messaging.dto.MessageDto;
import com.kinga.followtask.service.messaging.impl.whatsapp.raw.Neo4jTimestampUtil;
import com.kinga.followtask.service.messaging.impl.whatsapp.raw.WhatsAppRawConversation;
import com.kinga.followtask.service.messaging.impl.whatsapp.raw.WhatsAppRawMessage;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Component
public class WhatsAppMapper {



    /**
     * Reconstitue un MessageDto "résumé" à partir du dernierMessage
     * (utile pour un aperçu de liste, pas pour l'historique complet).
     */
    public MessageDto toLastMessageDto(WhatsAppRawConversation raw) {
        if (raw.getDernierMessage() == null) return null;
        var dm = raw.getDernierMessage();
        return MessageDto.builder()
                .canalExternalId(raw.getJid())
                .text(dm.getTexte())
                .createdAt(Neo4jTimestampUtil.toLocalDateTime(dm.getHorodatage()))
                .senderDisplayName(dm.isDeMoi() ? "moi" : raw.getNom())
                .build();
    }
    public CanalDto toCanalDto(WhatsAppRawConversation raw) {
        return CanalDto.builder()
                .externalId(raw.getJid())
                .pseudo(raw.getNom())
                .typeCanal(TypeCanal.WHATSAPP.name())
                .isGroup(raw.isEstGroupe())
                .unreadCount(raw.getNonLus())
                .messageCount(raw.getNombreMessages())
                .build();
    }

    // ---------- Messages ----------

    public MessageDto toMessageDto(WhatsAppRawMessage raw, String canalExternalId) {
        MediaType mediaType = com.kinga.followtask.service.messaging.impl.whatsapp.WhatsAppTypeResolver.resolve(raw.getType());

        return MessageDto.builder()
                .externalMessageId(raw.getId())
                .canalExternalId(canalExternalId)
                .text(raw.getTexte())
                .mediaType(mediaType)
                .fromMe(raw.isDeMoi())
                .senderExternalId(raw.isDeMoi() ? null : raw.getDe())
                .senderDisplayName(resolveSenderName(raw))
                .createdAt(toLocalDateTime(raw.getHorodatage()))
                .hasAttachment(raw.getMedia() != null && raw.getMedia().isDisponible())
                .attachments(raw.getMedia() != null && raw.getMedia().isDisponible()
                        ? List.of(toAttachmentDto(raw))
                        : List.of())
                .build();
    }

    private String resolveSenderName(WhatsAppRawMessage raw) {
        if (raw.isDeMoi()) return "moi";
        if (raw.getPushName() != null) return raw.getPushName();
        return raw.getNomExpediteur(); // fallback : numéro de téléphone
    }

    private AttachmentDto toAttachmentDto(WhatsAppRawMessage raw) {
        // Pas d'URL de téléchargement directe dans ce payload : on expose l'id du
        // message, le téléchargement effectif se fera via un endpoint dédié
        // (ex: GET /api/whatsapp/messages/{id}/media côté app externe).
        return AttachmentDto.builder()
                .externalAttachmentId(raw.getId())
                .mimeType(null) // inconnu tant que non téléchargé
                .downloadUrl(null)
                .build();
    }

    private LocalDateTime toLocalDateTime(long epochSeconds) {
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(epochSeconds), ZoneOffset.UTC);
    }
}