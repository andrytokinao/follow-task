package com.kinga.followtask.service.messaging.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AttachmentDto {
    private String externalMessageId;
    private String externalAttachmentId;
    private String fileName;
    private String mimeType;
    private Long sizeBytes;
    private String caption;
    private MediaType mediaType;
    private String senderExternalId;
    private boolean fromMe;
    private boolean downloaded;
    private String downloadUrl;
    private LocalDateTime createdAt;
}