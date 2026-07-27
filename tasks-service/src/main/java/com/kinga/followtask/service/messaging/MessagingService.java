package com.kinga.followtask.service.messaging;

import com.kinga.followtask.entity.TypeCanal;
import com.kinga.followtask.service.messaging.dto.*;

import java.util.List;

/**
 * Contrat à implémenter par chaque canal (WhatsApp, Facebook, Telegram, ...).
 */
public interface MessagingService {

    /** Type de canal géré par cette implémentation. */
    TypeCanal getType();

    /** Liste les groupes/canaux disponibles côté provider externe. */
    List<CanalDto> listCanaux();

    /** Détail d'un canal (description, propriétaire, membres inclus). */
    CanalDto getCanal(String canalExternalId);

    /** Liste des messages d'un canal, avec pagination/filtre date. */
    List<MessageDto> listMessages(String canalExternalId, MessageQueryDto query);

    /** Récupère un message précis. */
    MessageDto getMessage(String externalMessageId);

    /** Liste toutes les pièces jointes échangées dans un canal. */
    List<AttachmentDto> listAttachments(String canalExternalId);

    /** Télécharge le binaire d'une pièce jointe (déclenche le téléchargement si besoin). */
    byte[] downloadAttachment(String externalAttachmentId);

    /** Envoie un message sur le canal. */
    MessageDto sendMessage(String canalExternalId, SendMessageRequestDto request);

    /**
     * Traite un événement entrant (webhook / notification push) envoyé
     * par le provider externe, et le persiste (Canall + MessageApp).
     */
    void handleIncomingEvent(Object rawPayload);

    /**
     * Synchronise (pull) : va chercher les canaux/messages/membres côté provider
     * externe et les upsert en base locale (Canall / MessageApp / CanalMember).
     */
    void syncAll();
}