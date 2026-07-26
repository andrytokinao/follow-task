package com.kinga.followtask.service.messaging.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MemberDto {
    private String externalUserId;
    private String displayName;
    private String phoneOrContact;
}