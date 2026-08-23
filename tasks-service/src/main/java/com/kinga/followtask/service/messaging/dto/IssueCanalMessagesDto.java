package com.kinga.followtask.service.messaging.dto;

import com.kinga.followtask.entity.TypeCanal;
import lombok.Builder;

import java.util.List;
@Builder
public record IssueCanalMessagesDto(
        Long canalId,
        String canalPseudo,
        TypeCanal typeCanal,
        String linkMode,      // "FULL_CANAL" | "SELECTED_MESSAGES"
        List<MessageDto> messages
) {}