package com.kinga.followtask.service.messaging.dto;

import com.kinga.followtask.service.messaging.dto.MemberDto;
import lombok.*;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CanalDto {
    private String externalId;
    private String pseudo;
    private String typeCanal;
    private boolean isGroup;       // ajouté : estGroupe
    private int unreadCount;       // ajouté : nonLus
    private int messageCount;      // ajouté : nombreMessages
    private List<MemberDto> members;
}