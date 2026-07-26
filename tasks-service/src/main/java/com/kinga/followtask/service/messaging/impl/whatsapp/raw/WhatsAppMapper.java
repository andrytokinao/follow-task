package com.kinga.followtask.service.messaging.impl.whatsapp;

import com.kinga.followtask.entity.TypeCanal;
import com.kinga.followtask.service.messaging.dto.CanalDto;
import com.kinga.followtask.service.messaging.dto.MessageDto;
import com.kinga.followtask.service.messaging.impl.whatsapp.raw.Neo4jTimestampUtil;
import com.kinga.followtask.service.messaging.impl.whatsapp.raw.WhatsAppRawConversation;
import org.springframework.stereotype.Component;

@Component
public class WhatsAppMapper {

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
}