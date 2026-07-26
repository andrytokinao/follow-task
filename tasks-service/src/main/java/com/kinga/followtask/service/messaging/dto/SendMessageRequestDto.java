package com.kinga.followtask.service.messaging.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SendMessageRequestDto {
    private String text;
    private String mediaUrl;
    private String mediaType;
}