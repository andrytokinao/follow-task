package com.kinga.followtask.service.messaging.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MessageDto {
    private String externalMessageId;
    private String canalExternalId;
    private String text;
    private String mediaType;          // TEXT, IMAGE, VIDEO, DOCUMENT, AUDIO...
    private String senderExternalId;
    private String senderDisplayName;
    private LocalDateTime createdAt;
    private List<AttachmentDto> attachments;
}