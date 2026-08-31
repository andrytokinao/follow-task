package com.kinga.followtask.service.messaging;

import com.kinga.followtask.entity.*;
import com.kinga.followtask.service.messaging.dto.*;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MessagingMapper {

    public CanalDto toCanalDto(Canall canall) {
        return CanalDto.builder()
                .externalId(canall.getExternalId())
                .pseudo(canall.getPseudo())
                .typeCanal(canall.getTypeCanal().name())
               // .isGroup(canall.isGroup())
                .build();
    }

    public CanalDto toCanalDetailDto(Canall canall, List<CanalContact> links, List<IssueCanalLink> issueLinks) {
        List<MemberDto> members = links.stream()
                .map(link -> toMemberDto(link.getContact()))
                .toList();

        return CanalDto.builder()
                .externalId(canall.getExternalId())
                .pseudo(canall.getPseudo())
                .typeCanal(canall.getTypeCanal().name())
            //   .isGroup(canall.isGroup())
                .memberCount(members.size())
                .members(members)
                .issueLinks(issueLinks)
                .build();
    }

    private MemberDto toMemberDto(Contact contact) {
        return MemberDto.builder()
                .externalUserId(contact.getValue())
                .displayName(contact.getDisplayName())
                .build();
    }

    public MessageDto toMessageDto(MessageApp message) {
        return MessageDto.builder()
                .externalMessageId(message.getExternalMessageId())
                .canalExternalId(message.getCanall().getExternalId())
                .text(message.getText())
                .mediaType(MediaType.valueOf(message.getMediaType()))
             //   .fromMe(message.isFromMe())
             //   .senderExternalId(message.getSenderExternalId())
             //   .senderDisplayName(message.isFromMe() ? "moi" : message.getFallbackSenderName())
                .createdAt(message.getCreated())
                .hasAttachment(false) // pas de MediaType persisté distinct — voir point 4
                .attachments(List.of())
                .build();
    }
}