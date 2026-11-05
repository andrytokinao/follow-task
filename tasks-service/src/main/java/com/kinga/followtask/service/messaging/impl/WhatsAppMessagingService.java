package com.kinga.followtask.service.messaging.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kinga.followtask.entity.*;
import com.kinga.followtask.entity.enumapp.TypeContact;
import com.kinga.followtask.repository.*;
import com.kinga.followtask.service.messaging.DirectMessageReader;
import com.kinga.followtask.service.messaging.MessagingService;
import com.kinga.followtask.service.messaging.dto.*;
import com.kinga.followtask.service.messaging.impl.whatsapp.WhatsAppMapper;
import com.kinga.followtask.service.messaging.impl.whatsapp.WhatsAppWebhookAdapter;
import com.kinga.followtask.service.messaging.impl.whatsapp.raw.*;
import io.micrometer.common.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhatsAppMessagingService implements MessagingService, DirectMessageReader {
    private final ObjectMapper objectMapper;
    private final WhatsAppWebhookAdapter adapter;
    private final CanalRepository canallRepository;
    private final MessagesRepository messageAppRepository;
    private final CanalMemberRepository canalMemberRepository;
    private final WhatsAppMapper mapper;

    private final ContactRepository contactRepository;
    private final CanalContactRepository canalContactRepository;
    @Value("${messaging.whatsapp.base-url}")
    private String whatsAppListenerBaseUrl;

    /**
     * Si true, les messages des conversations privées sont aussi enregistrés (un canal est
     * créé à la volée). Par défaut false : listCanaux() ne garde que les groupes, et les
     * messages privés sont lus à la demande via recentDirectMessages().
     */
    @Value("${messaging.whatsapp.persist-direct-messages:false}")
    private boolean persistDirectMessages;

    private RestClient client() {
        return RestClient.builder().baseUrl(whatsAppListenerBaseUrl).build();
    }

    @Override
    public TypeCanal getType() {
        return TypeCanal.WHATSAPP;
    }

    // ---------- Canaux ----------

    @Override
    public List<CanalDto> listCanaux() {
        WhatsAppRawConversationsResponse response = client().get()
                .uri("/api/whatsapp/conversations-history")
                .retrieve()
                .body(WhatsAppRawConversationsResponse.class);

        if (response == null || !response.isSucces() || response.getDonnees() == null) {
            log.warn("Réponse invalide (conversations) depuis l'app WhatsApp externe");
            return List.of();
        }

        return response.getDonnees().stream()
                .map(mapper::toCanalDto)
                .filter(m -> m.isGroup())
                .toList();
    }

    /**
     * Conversations privees portant un message recent : ce sont les seules ou
     * un code de rattachement peut etre arrive.
     *
     * <p>Le tri par date du dernier message evite d'aller chercher l'historique
     * de toutes les conversations : une seule requete de liste, puis une
     * requete de messages par conversation ayant bouge depuis {@code since}.</p>
     */
    @Override
    public List<MessageDto> recentDirectMessages(LocalDateTime since) {
        WhatsAppRawConversationsResponse response = client().get()
                .uri("/api/whatsapp/conversations-history")
                .retrieve()
                .body(WhatsAppRawConversationsResponse.class);

        if (response == null || !response.isSucces() || response.getDonnees() == null) {
            log.warn("Réponse invalide (conversations) depuis l'app WhatsApp externe");
            return List.of();
        }

        return response.getDonnees().stream()
                .filter(conversation -> !conversation.isEstGroupe())
                .filter(conversation -> aBougeDepuis(conversation, since))
                .flatMap(conversation -> listMessages(conversation.getJid(), null).stream())
                .filter(message -> !message.isFromMe())
                .filter(message -> message.getCreatedAt() != null && !message.getCreatedAt().isBefore(since))
                .toList();
    }

    /**
     * Le dernier message de la conversation est-il posterieur a l'instant
     * donne ? Une conversation sans horodatage lisible est retenue : mieux vaut
     * une requete de trop qu'un code manque.
     */
    private boolean aBougeDepuis(WhatsAppRawConversation conversation, LocalDateTime since) {
        WhatsAppRawLastMessage dernier = conversation.getDernierMessage();
        if (dernier == null || dernier.getHorodatage() == null) {
            return true;
        }
        LocalDateTime date = mapper.toLocalDateTime(dernier.getHorodatage());
        return date == null || !date.isBefore(since);
    }

    @Override
    public CanalDto getCanal(String canalExternalId) {
        WhatsAppRawMembersResponse response = client().get()
                .uri("/api/whatsapp/groupes-history/{jid}/membres", canalExternalId)
                .retrieve()
                .body(WhatsAppRawMembersResponse.class);

        if (response == null || !response.isSucces() || response.getDonnees() == null) {
            throw new IllegalStateException("Canal introuvable : " + canalExternalId);
        }

        return mapper.toCanalDetailDto(response.getDonnees());
    }

    // ---------- Messages ----------

    @Override
    public List<MessageDto> listMessages(String canalExternalId, MessageQueryDto query) {
        WhatsAppRawMessagesResponse response = client().get()
                .uri("/api/whatsapp/conversations-history/{jid}/messages", canalExternalId)
                .retrieve()
                .body(WhatsAppRawMessagesResponse.class);

        if (response == null || !response.isSucces() || response.getDonnees() == null) {
            log.warn("Réponse invalide (messages) pour le canal {}", canalExternalId);
            return List.of();
        }

        return response.getDonnees().getMessages().stream()
                .map(raw -> mapper.toMessageDto(raw, canalExternalId))
                .filter(dto -> !WhatsAppTypeResolver.isIgnorable(dto.getMediaType()))
                .toList();
    }

    @Override
    public MessageDto getMessage(String externalMessageId) {
        // Le provider WhatsApp actuel n'expose pas de lookup direct par messageId.
        // Non supporté tant que l'app externe n'ajoute pas cet endpoint.
        throw new UnsupportedOperationException(
                "getMessage non supporté par le provider WhatsApp pour le moment");
    }

    // ---------- Pièces jointes ----------

    @Override
    public List<AttachmentDto> listAttachments(String canalExternalId) {
        WhatsAppRawFilesResponse response = client().get()
                .uri("/api/whatsapp/conversations-history/{jid}/fichiers", canalExternalId)
                .retrieve()
                .body(WhatsAppRawFilesResponse.class);

        if (response == null || !response.isSucces() || response.getDonnees() == null) {
            log.warn("Réponse invalide (fichiers) pour le canal {}", canalExternalId);
            return List.of();
        }

        return response.getDonnees().getFichiers().stream()
                .map(mapper::toAttachmentDto)
                .toList();
    }

    @Override
    public byte[] downloadAttachment(String externalAttachmentId) {
        // externalAttachmentId = messageId côté WhatsApp (1 fichier = 1 message)
        return client().get()
                .uri("/api/whatsapp/fichiers/{messageId}/telecharger", externalAttachmentId)
                .retrieve()
                .body(byte[].class);
    }

    // ---------- Envoi ----------

    @Override
    public MessageDto sendMessage(String canalExternalId, SendMessageRequestDto request) {
        // canalExternalId = numéro WhatsApp du destinataire (ex: 261340000000)
        if (request == null || request.getText() == null || request.getText().isBlank()) {
            throw new IllegalArgumentException("Le texte du message est obligatoire");
        }

        if (request.getMediaUrl() != null && !request.getMediaUrl().isBlank()) {
            throw new UnsupportedOperationException(
                    "L'envoi de média n'est pas encore supporté pour WhatsApp");
        }

        WhatsAppSendRequest body = WhatsAppSendRequest.builder()
                .to(canalExternalId)
                .txt(request.getText())
                .build();

        try {
            // Réponse brute (Map) car sa structure exacte n'est pas confirmée
            Map<String, Object> response = client().post()
                    .uri("/api/whatsapp/envoyer")
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            return MessageDto.builder()
                    .externalMessageId(extractMessageId(response))
                    .canalExternalId(canalExternalId)
                    .text(request.getText())
                    .fromMe(true)
                    .hasAttachment(false)
                    .createdAt(LocalDateTime.now())
                    .build();

        } catch (RestClientResponseException e) {
            throw new IllegalStateException(
                    "Échec de l'envoi WhatsApp (HTTP " + e.getStatusCode().value() + ") : "
                            + e.getResponseBodyAsString(), e);
        }
    }

    private String extractMessageId(Map<String, Object> response) {
        if (response == null) return null;
        for (String key : List.of("messageId", "id", "message_id", "whatsappId")) {
            Object value = response.get(key);
            if (value != null) return value.toString();
        }
        // /envoyer renvoie { succes, donnees: { whatsappId, ... } }
        Object donnees = response.get("donnees");
        if (donnees instanceof Map<?, ?> map) {
            Object whatsappId = map.get("whatsappId");
            if (whatsappId != null) return whatsappId.toString();
        }
        return null;
    }

    // ---------- Webhook ----------

    /**
     * Le gateway envoie deux familles de payloads :
     * <ul>
     *   <li>{@code evenement} = message.recu / message.envoye : le webhook détaillé (canalId,
     *       messageId WhatsApp, deMoi, traiteLe...). C'est le seul traité ici.</li>
     *   <li>{@code event} = message.created / media.created : relais temps réel avec un
     *       compteur interne et le JID téléphone. Doublon du précédent : ignoré, sinon chaque
     *       message serait enregistré deux fois sous un canal qui n'existe pas.</li>
     * </ul>
     * Ne lève jamais d'exception vers le contrôleur : le gateway ne rejoue pas les webhooks.
     */
    @Override
    public void handleIncomingEvent(Object rawPayload) {
        try {
            JsonNode node = objectMapper.valueToTree(rawPayload);

            if (node.has("evenement")) {
                WhatsAppIncomingWebhook webhook =
                        objectMapper.treeToValue(node, WhatsAppIncomingWebhook.class);
                handleWebhookMessage(webhook);
            } else if (node.has("event")) {
                log.debug("Événement temps réel ignoré (doublon du webhook détaillé) : {}",
                        node.path("event").asText());
            } else {
                log.warn("Webhook WhatsApp : format inconnu : {}", node);
            }
        } catch (JsonProcessingException e) {
            log.error("Webhook WhatsApp : payload invalide : {}", rawPayload, e);
        } catch (RuntimeException e) {
            log.error("Webhook WhatsApp : échec du traitement : {}", e.getMessage(), e);
        }
    }

    private void handleWebhookMessage(WhatsAppIncomingWebhook w) {
        if (StringUtils.isBlank(w.canalId()) || StringUtils.isBlank(w.messageId())) {
            log.warn("Webhook WhatsApp ignoré : canalId ou messageId manquant ({})", w.evenement());
            return;
        }

        boolean groupe = w.canalGroupe();
        if (!groupe && !persistDirectMessages) {
            log.debug("Message privé non enregistré (messaging.whatsapp.persist-direct-messages=false) : {}",
                    w.messageId());
            return;
        }

        // canalExternalId = canalId (clé réelle de la conversation dans le gateway),
        // et non "expediteur" qui est le numéro de téléphone du contact.
        trouverOuCreerCanal(w, groupe);

        WhatsAppRawMessage raw = adapter.toRawMessage(w);
        MessageDto dto = mapper.toMessageDto(raw, w.canalId());
        persistMessage(dto);
    }

    /**
     * Retrouve le canal par sa clé gateway, ou le crée. Synchronisé : deux webhooks
     * simultanés d'un nouveau canal ne doivent pas le créer deux fois.
     */
    private synchronized Canall trouverOuCreerCanal(WhatsAppIncomingWebhook w, boolean groupe) {
        return canallRepository.findByExternalId(w.canalId()).orElseGet(() -> {
            CanalDto dto = null;

            if (groupe) {
                try {
                    dto = getCanal(w.canalId());   // nom réel du groupe + membres
                } catch (Exception e) {
                    log.debug("Détail du groupe {} indisponible : {}", w.canalId(), e.getMessage());
                }
            }

            if (dto == null) {
                dto = CanalDto.builder()
                        .externalId(w.canalId())
                        .pseudo(groupe || StringUtils.isBlank(w.nomExpediteur()) ? w.canalId() : w.nomExpediteur())
                        .typeCanal(TypeCanal.WHATSAPP.name())
                        .isGroup(groupe)
                        .build();
            }

            Canall canall = persistCanal(dto);
            try {
                persistMembers(dto);
            } catch (Exception e) {
                log.debug("Membres du canal {} non enregistrés : {}", w.canalId(), e.getMessage());
            }
            return canall;
        });
    }

    // ---------- Synchronisation complète ----------

    @Override
    public void syncAll() {
        List<CanalDto> canaux = listCanaux();
        canaux.forEach(canalSummary -> {
            try {
                CanalDto detail = getCanal(canalSummary.getExternalId());
                persistCanal(detail);
                persistMembers(detail);
            } catch (Exception e) {
                log.warn("Échec sync détail/membres pour {} : {}", canalSummary.getExternalId(), e.getMessage());
                persistCanal(canalSummary);
            }

            List<MessageDto> messages = listMessages(canalSummary.getExternalId(),
                    MessageQueryDto.builder().page(0).size(100).build());
            messages.forEach(this::persistMessage);
        });
    }

    @Override
    public String getAvatarUrl(String externalId) {
        try {
            WhatsAppRawAvatarResponse response = client().get()
                    .uri("/api/whatsapp/contacts/{id}/photo", externalId)
                    .retrieve()
                    .body(WhatsAppRawAvatarResponse.class);

            if (response == null || !response.isSucces()) {
                return null;
            }
            return response.getUrl();
        } catch (Exception e) {
            log.debug("Avatar indisponible pour {} : {}", externalId, e.getMessage());
            return null;
        }
    }

    // ---------- Persistance locale (upsert) ----------

    private Canall persistCanal(CanalDto dto) {
        Canall canall = canallRepository.findByExternalId(dto.getExternalId())
                .orElseGet(Canall::new);
        canall.setExternalId(dto.getExternalId());
        canall.setPseudo(dto.getPseudo());
        canall.setTypeCanal(TypeCanal.WHATSAPP);
        return canallRepository.save(canall);
    }

    private void persistMembers(CanalDto dto) {
        if (dto.getMembers() == null || dto.getMembers().isEmpty()) return;

        Canall canall = canallRepository.findByExternalId(dto.getExternalId())
                .orElseThrow(() -> new IllegalStateException("Canal introuvable : " + dto.getExternalId()));

        dto.getMembers().forEach(memberDto -> {
            Contact contact = upsertContact(memberDto);
            upsertCanalContact(canall, contact);
        });
    }
    @Override
    public Contact upsertContact(MemberDto dto) {
        Contact contact = contactRepository
                .findByTypeContactAndExternalId(TypeContact.WHATSAPP, dto.getExternalUserId())
                .orElseGet(Contact::new);

        contact.setTypeContact(TypeContact.WHATSAPP);
        contact.setExternalId(dto.getExternalUserId());
        contact.setValue(extractPhone(dto.getExternalUserId()));
        contact.setDisplayName(dto.getDisplayName());
        return contactRepository.save(contact);
    }

    private String extractPhone(String jid) {
        int at = jid.indexOf('@');
        return at > 0 ? jid.substring(0, at) : jid;
    }

    private void upsertCanalContact(Canall canall, Contact contact) {
        CanalContact link = canalContactRepository.findByCanallAndContact(canall, contact)
                .orElseGet(CanalContact::new);
        link.setCanall(canall);
        link.setContact(contact);
        canalContactRepository.save(link);
    }

    private void persistMessage(MessageDto dto) {
        if (dto.getMediaType() == com.kinga.followtask.service.messaging.dto.MediaType.SYSTEM) return;
        if (messageAppRepository.existsByExternalMessageId(dto.getExternalMessageId())) return;

        Canall canall = canallRepository.findByExternalId(dto.getCanalExternalId())
                .orElseThrow(() -> new IllegalStateException("Canal introuvable : " + dto.getCanalExternalId()));

        MessageApp message = new MessageApp();
        message.setExternalMessageId(dto.getExternalMessageId());
        if (StringUtils.isEmpty(dto.getText()))
            return;
        message.setCanall(canall);
        message.setText(dto.getText());
        message.setMediaType(dto.getMediaType().name());
        message.setCreated(dto.getCreatedAt() != null ? dto.getCreatedAt() : LocalDateTime.now());
        message.setFallbackSenderName(dto.getSenderDisplayName());
        messageAppRepository.save(message);
    }
}