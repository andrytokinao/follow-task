package com.kinga.followtask.service.messaging.impl;

import com.kinga.followtask.entity.*;
import com.kinga.followtask.entity.enumapp.TypeContact;
import com.kinga.followtask.repository.*;
import com.kinga.followtask.service.messaging.MessagingService;
import com.kinga.followtask.service.messaging.dto.*;
import com.kinga.followtask.service.messaging.impl.whatsapp.WhatsAppMapper;
import com.kinga.followtask.service.messaging.impl.whatsapp.WhatsAppTypeResolver;
import com.kinga.followtask.service.messaging.impl.whatsapp.raw.*;
import io.micrometer.common.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhatsAppMessagingService implements MessagingService {

    private final CanalRepository canallRepository;
    private final MessagesRepository messageAppRepository;
    private final CanalMemberRepository canalMemberRepository;
    private final WhatsAppMapper mapper;

    private final ContactRepository contactRepository;
    private final CanalContactRepository canalContactRepository;
    @Value("${messaging.whatsapp.base-url}")
    private String whatsAppListenerBaseUrl;

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
                .toList();
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
        throw new UnsupportedOperationException(
                "sendMessage non encore implémenté pour WhatsApp — endpoint à confirmer côté app externe");
    }

    // ---------- Webhook ----------

    @Override
    public void handleIncomingEvent(Object rawPayload) {
        log.info("Webhook WhatsApp reçu : {}", rawPayload);
        // TODO: parser rawPayload -> WhatsAppRawMessage (ou format webhook dédié)
        // puis mapper.toMessageDto(...) + persistMessage(dto)
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
                persistCanal(canalSummary); // fallback : au moins le canal minimal
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
            return response.getUrl(); // ou base64 selon ce que renvoie réellement votre app
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

    private Contact upsertContact(MemberDto dto) {
        Contact contact = contactRepository
                .findByTypeContactAndValue(TypeContact.WHATSAPP, dto.getExternalUserId())
                .orElseGet(Contact::new);

        contact.setTypeContact(TypeContact.WHATSAPP);
        contact.setValue(dto.getExternalUserId());
        contact.setDisplayName(dto.getDisplayName());
        // userApp reste null tant qu'aucune résolution n'a été faite (numéro connu, etc.)
        return contactRepository.save(contact);
    }

    private void upsertCanalContact(Canall canall, Contact contact) {
        CanalContact link = canalContactRepository.findByCanallAndContact(canall, contact)
                .orElseGet(CanalContact::new);
        link.setCanall(canall);
        link.setContact(contact);
        canalContactRepository.save(link);
    }

    private void persistMessage(MessageDto dto) {
        if (dto.getMediaType() == MediaType.SYSTEM) return;
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