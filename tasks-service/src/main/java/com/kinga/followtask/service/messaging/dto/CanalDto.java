package com.kinga.followtask.service.messaging.dto;

import com.kinga.followtask.entity.IssueCanalLink;
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

    // Liens actifs (endedAt == null) vers les issues de suivi. Rempli
    // uniquement par getCanal : les remonter pour chaque canal de listCanaux
    // coûterait une requête par canal pour une donnée affichée seulement dans
    // le panneau de la conversation ouverte.
    private List<IssueCanalLink> issueLinks;
}