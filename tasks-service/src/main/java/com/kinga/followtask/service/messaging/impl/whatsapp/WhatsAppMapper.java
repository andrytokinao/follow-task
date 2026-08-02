package com.kinga.followtask.service.messaging.impl.whatsapp;

import com.kinga.followtask.entity.TypeCanal;
import com.kinga.followtask.service.messaging.dto.*;
import com.kinga.followtask.service.messaging.impl.whatsapp.raw.*;
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
                .createdAt(toLocalDateTime(dm.getHorodatage()))
                .senderDisplayName(dm.isDeMoi() ? "moi" : raw.getNom())
                .build();
    }

    // WhatsAppMapper.java

    public CanalDto toCanalDto(WhatsAppRawConversation raw) {
        return CanalDto.builder()
                .externalId(raw.getJid())
                .pseudo(raw.getNom())
                .typeCanal(TypeCanal.WHATSAPP.name())
                .isGroup(raw.isEstGroupe())
                .unreadCount(raw.getNonLus())
                .messageCount(raw.getNombreMessages())
                .avatarUrl(raw.getPhoto())   // null pour l'instant côté provider WhatsApp
                .build();
    }

    public CanalDto toCanalDetailDto(WhatsAppRawMembersData raw) {
        List<MemberDto> members = raw.getMembres() == null ? List.of() :
                raw.getMembres().stream().map(this::toMemberDto).toList();

        return CanalDto.builder()
                .externalId(raw.getJid())
                .pseudo(raw.getNom())
                .typeCanal(TypeCanal.WHATSAPP.name())
                .isGroup(true)
                .description(raw.getDescription())
                .ownerExternalId(raw.getProprietaire())
                .memberCount(raw.getNombreMembres())
                .members(members)
                .build();
        // avatarUrl non fourni par cet endpoint spécifique (membres), à récupérer via
        // getCanalAvatar() séparément si besoin (voir section 5)
    }


    private MemberDto toMemberDto(WhatsAppRawMember raw) {
        return MemberDto.builder()
                .externalUserId(raw.getJid())
                .displayName(raw.getNom())
                .phoneOrContact(raw.getNumero())
                .admin(Boolean.TRUE.equals(raw.getAdmin()))
                .build();
    }
    public AttachmentDto toAttachmentDto(WhatsAppRawFile raw) {
        return AttachmentDto.builder()
                .externalMessageId(raw.getMessageId())
                .externalAttachmentId(raw.getMessageId())
                .fileName(raw.getNomFichierOriginal())
                .mimeType(raw.getMimetype())
                .sizeBytes(raw.getTailleOctets())
                .caption(raw.getLegende())
                .mediaType(com.kinga.followtask.service.messaging.impl.whatsapp.WhatsAppTypeResolver.resolve(raw.getType()))
                .senderExternalId(raw.isDeMoi() ? null : raw.getDe())
                .fromMe(raw.isDeMoi())
                .downloaded(raw.isTelecharge())
                .downloadUrl(raw.getUrl())
                .createdAt(LocalDateTime.ofInstant(
                        Instant.ofEpochSecond(raw.getHorodatage()), ZoneOffset.UTC))
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
                .senderAvatarUrl(null)
                .createdAt(toLocalDateTime(raw.getHorodatage()))
                .hasAttachment(raw.getMedia() != null && raw.getMedia().isDisponible())
                .attachments(raw.getMedia() != null && raw.getMedia().isDisponible()
                        ? List.of(toAttachmentDto(raw)) : List.of())
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
                .externalMessageId(raw.getId())
                .mimeType(null) // inconnu tant que non téléchargé
                .downloadUrl(null)
                .build();
    }

    private LocalDateTime toLocalDateTime(Long epochSeconds) {
        if (epochSeconds == null) return null;
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(epochSeconds), ZoneOffset.UTC);
    }
}