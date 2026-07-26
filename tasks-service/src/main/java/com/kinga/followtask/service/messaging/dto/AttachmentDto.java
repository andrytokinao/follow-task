package com.kinga.followtask.service.messaging.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AttachmentDto {
    private String externalAttachmentId;
    private String fileName;
    private String mimeType;
    private Long sizeBytes;
    private String downloadUrl; // ou base64 si petit fichier
}