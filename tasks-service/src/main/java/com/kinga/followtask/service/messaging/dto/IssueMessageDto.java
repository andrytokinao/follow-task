package com.kinga.followtask.service.messaging.dto;

import com.kinga.followtask.service.messaging.dto.AttachmentDto;
import com.kinga.followtask.service.messaging.dto.MediaType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class IssueMessageDto {
    private Long id;
    private String externalMessageId;
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