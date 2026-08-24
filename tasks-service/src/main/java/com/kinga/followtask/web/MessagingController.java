package com.kinga.followtask.web;

import com.kinga.followtask.entity.TypeCanal;
import com.kinga.followtask.service.messaging.MessagingReadService;
import com.kinga.followtask.service.messaging.MessagingServiceRegistry;
import com.kinga.followtask.service.messaging.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/messaging")
public class MessagingController {

    private final MessagingServiceRegistry registry;   // sync, send, webhook, download
    private final MessagingReadService readService;     // toute la lecture (DB)

    // ---------- Lecture (DB) ----------

    @GetMapping("/{type}/canaux")
    public List<CanalDto> listCanaux(@PathVariable TypeCanal type) {
        return readService.listCanaux(type);
    }

    @GetMapping("/{type}/canaux/{externalId}")
    public CanalDto getCanal(@PathVariable TypeCanal type, @PathVariable String externalId) {
        return readService.getCanal(type, externalId);
    }

    @GetMapping("/{type}/canaux/{externalId}/messages")
    public Page<MessageDto> listMessages(@PathVariable TypeCanal type, @PathVariable String externalId,
                                         MessageQueryDto query) {
        return readService.listMessages(type, externalId, query);
    }

    @GetMapping("/{type}/messages/{externalMessageId}")
    public MessageDto getMessage(@PathVariable TypeCanal type, @PathVariable String externalMessageId) {
        return readService.getMessage(type, externalMessageId);
    }

    @GetMapping("/{type}/canaux/{externalId}/attachments")
    public List<AttachmentDto> listAttachments(@PathVariable TypeCanal type, @PathVariable String externalId) {
        return readService.listAttachments(type, externalId);
    }

    // ---------- Écriture / actions live (provider externe) ----------

    @PostMapping("/{type}/canaux/{externalId}/messages")
    public MessageDto sendMessage(@PathVariable TypeCanal type, @PathVariable String externalId,
                                  @RequestBody SendMessageRequestDto request) {
        return registry.get(type).sendMessage(externalId, request);
    }

    @GetMapping("/{type}/attachments/{externalAttachmentId}/download")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable TypeCanal type,
                                                     @PathVariable String externalAttachmentId) {
        return ResponseEntity.ok(registry.get(type).downloadAttachment(externalAttachmentId));
    }

    @PostMapping("/{type}/sync")
    public ResponseEntity<Void> sync(@PathVariable TypeCanal type) {
        registry.get(type).syncAll();
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/{type}/webhook")
    public ResponseEntity<Void> webhook(@PathVariable TypeCanal type, @RequestBody Object payload) {
        registry.get(type).handleIncomingEvent(payload);
        return ResponseEntity.ok().build();
    }
}