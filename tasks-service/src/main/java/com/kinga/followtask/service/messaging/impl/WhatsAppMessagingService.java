package com.kinga.followtask.service.messaging.impl;

import com.kinga.followtask.entity.*;
import com.kinga.followtask.repository.CanalRepository;
import com.kinga.followtask.repository.MessagesRepository;
import com.kinga.followtask.service.messaging.MessagingService;
import com.kinga.followtask.service.messaging.dto.*;
import com.kinga.followtask.service.messaging.impl.whatsapp.WhatsAppMapper;
import com.kinga.followtask.service.messaging.impl.whatsapp.WhatsAppTypeResolver;
import com.kinga.followtask.service.messaging.impl.whatsapp.raw.WhatsAppRawConversationsResponse;
import com.kinga.followtask.service.messaging.impl.whatsapp.raw.WhatsAppRawMessagesResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhatsAppMessagingService implements MessagingService {

    private final CanalRepository canallRepository;
    private final MessagesRepository messageAppRepository;
    private final WhatsAppMapper mapper;

    @Value("${messaging.whatsapp.base-url}")
    private String whatsAppListenerBaseUrl;

    private RestClient client() {
        return RestClient.builder().baseUrl(whatsAppListenerBaseUrl).build();
    }

    @Override
    public TypeCanal getType() {
        return TypeCanal.WHATSAPP;
    }

    @Override
    public List<CanalDto> listCanaux() {
        WhatsAppRawConversationsResponse response = client().get()
                .uri("/api/whatsapp/conversations-history")
                .retrieve()
                .body(WhatsAppRawConversationsResponse.class);

        if (response == null || !response.isSucces() || response.getDonnees() == null) {
            log.warn("Réponse invalide depuis l'app WhatsApp externe");
            return List.of();
        }

        return response.getDonnees().stream()
                .map(mapper::toCanalDto)
                .toList();
    }
    @Override
    public CanalDto getCanal(String canalExternalId) {
        return client().get()
                .uri("/api/groups/{id}", canalExternalId)
                .retrieve()
                .body(CanalDto.class);
    }

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
        return client().get()
                .uri("/api/messages/{id}", externalMessageId)
                .retrieve()
                .body(MessageDto.class);
    }

    @Override
    public List<AttachmentDto> getAttachments(String externalMessageId) {
        AttachmentDto[] result = client().get()
                .uri("/api/messages/{id}/attachments", externalMessageId)
                .retrieve()
                .body(AttachmentDto[].class);
        return result == null ? List.of() : List.of(result);
    }

    @Override
    public byte[] downloadAttachment(String externalAttachmentId) {
        return client().get()
                .uri("/api/attachments/{id}/download", externalAttachmentId)
                .retrieve()
                .body(byte[].class);
    }

    @Override
    public MessageDto sendMessage(String canalExternalId, SendMessageRequestDto request) {
        return client().post()
                .uri("/api/groups/{id}/messages", canalExternalId)
                .body(request)
                .retrieve()
                .body(MessageDto.class);
    }

    @Override
    public void handleIncomingEvent(Object rawPayload) {
        // Ex: votre app WhatsApp externe pousse directement un MessageDto
        // à adapter selon le vrai format de payload qu'elle envoie.
        // Ici on suppose un mapping direct via Jackson (via @RequestBody Object -> conversion manuelle si besoin)
        // Pour rester générique, on préfère exposer un endpoint typé dédié si le format diffère du MessageDto.
        log.info("Webhook WhatsApp reçu : {}", rawPayload);
        // TODO: parser rawPayload -> MessageDto puis appeler persistMessage(dto)
    }

    @Override
    public void syncAll() {
        List<CanalDto> canaux = listCanaux();
        canaux.forEach(this::persistCanal);

        canaux.forEach(canalDto -> {
            List<MessageDto> messages = listMessages(canalDto.getExternalId(),
                    MessageQueryDto.builder().page(0).size(100).build());
            messages.forEach(this::persistMessage);
        });
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

    private void persistMessage(MessageDto dto) {
        if (dto.getMediaType() == MediaType.SYSTEM) return; // bruit technique, pas un vrai message
        if (messageAppRepository.existsByExternalMessageId(dto.getExternalMessageId())) return;

        Canall canall = canallRepository.findByExternalId(dto.getCanalExternalId())
                .orElseThrow(() -> new IllegalStateException("Canal introuvable : " + dto.getCanalExternalId()));

        MessageApp message = new MessageApp();
        message.setExternalMessageId(dto.getExternalMessageId());
        message.setCanall(canall);
        message.setText(dto.getText());
        message.setMediaType(dto.getMediaType().name());
        message.setCreated(dto.getCreatedAt() != null ? dto.getCreatedAt() : LocalDateTime.now());
        message.setFallbackSenderName(dto.getSenderDisplayName());
        messageAppRepository.save(message);
    }
}