package com.kinga.followtask.web;

import com.kinga.followtask.entity.TypeCanal;
import com.kinga.followtask.service.messaging.MessagingServiceRegistry;
import com.kinga.followtask.service.messaging.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/messaging")
public class MessagingController {

    private final MessagingServiceRegistry registry;

    // ---------- Canaux ----------

    @GetMapping("/{type}/canaux")
    public List<CanalDto> listCanaux(@PathVariable TypeCanal type) {
        return registry.get(type).listCanaux();
    }

    @GetMapping("/{type}/canaux/{externalId}")
    public CanalDto getCanal(@PathVariable TypeCanal type, @PathVariable String externalId) {
        return registry.get(type).getCanal(externalId);
    }

    // ---------- Messages ----------

    @GetMapping("/{type}/canaux/{externalId}/messages")
    public List<MessageDto> listMessages(
            @PathVariable TypeCanal type,
            @PathVariable String externalId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime until
    ) {
        MessageQueryDto query = MessageQueryDto.builder()
                .page(page).size(size).since(since).until(until).build();
        return registry.get(type).listMessages(externalId, query);
    }

    @GetMapping("/{type}/messages/{externalMessageId}")
    public MessageDto getMessage(@PathVariable TypeCanal type, @PathVariable String externalMessageId) {
        return registry.get(type).getMessage(externalMessageId);
    }

    @PostMapping("/{type}/canaux/{externalId}/messages")
    public MessageDto sendMessage(
            @PathVariable TypeCanal type,
            @PathVariable String externalId,
            @RequestBody SendMessageRequestDto request
    ) {
        return registry.get(type).sendMessage(externalId, request);
    }

    // ---------- Pièces jointes (au niveau du canal) ----------

    @GetMapping("/{type}/canaux/{externalId}/attachments")
    public List<AttachmentDto> listAttachments(@PathVariable TypeCanal type, @PathVariable String externalId) {
        return registry.get(type).listAttachments(externalId);
    }

    @GetMapping("/{type}/attachments/{externalAttachmentId}/download")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable TypeCanal type, @PathVariable String externalAttachmentId) {
        byte[] data = registry.get(type).downloadAttachment(externalAttachmentId);
        return ResponseEntity.ok(data);
    }

    // ---------- Webhook (réception push) ----------

    @PostMapping("/{type}/webhook")
    public ResponseEntity<Void> webhook(@PathVariable TypeCanal type, @RequestBody Object payload) {
        registry.get(type).handleIncomingEvent(payload);
        return ResponseEntity.ok().build();
    }

    // ---------- Synchronisation manuelle (pull) ----------

    @PostMapping("/{type}/sync")
    public ResponseEntity<Void> sync(@PathVariable TypeCanal type) {
        registry.get(type).syncAll();
        return ResponseEntity.accepted().build();
    }
}