package com.kinga.followtask.service.messaging.dto;

import com.kinga.followtask.service.messaging.dto.MemberDto;
import lombok.*;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CanalDto {
    private String externalId;
    private String pseudo;
    private String typeCanal;
    private boolean isGroup;
    private int unreadCount;
    private int messageCount;
    private String description;
    private String ownerExternalId;
    private int memberCount;
    private String avatarUrl;
    private List<MemberDto> members;
    private MessageDto lastMessage;
}