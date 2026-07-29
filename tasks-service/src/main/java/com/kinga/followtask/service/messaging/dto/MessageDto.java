package com.kinga.followtask.service.messaging.dto;

import com.kinga.followtask.service.messaging.dto.AttachmentDto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MessageDto {
    private String externalMessageId;
    private String canalExternalId;
    private String text;
    private MediaType mediaType;
    private String senderExternalId;
    private String senderDisplayName;
    private String senderAvatarUrl;
    private LocalDateTime createdAt;
    private boolean fromMe;
    private boolean hasAttachment;
    private List<AttachmentDto> attachments;
}