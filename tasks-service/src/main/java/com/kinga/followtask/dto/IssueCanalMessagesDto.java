package com.kinga.followtask.dto;

import com.kinga.followtask.entity.TypeCanal;
import com.kinga.followtask.service.messaging.dto.IssueMessageDto;
import com.kinga.followtask.service.messaging.dto.MessageDto;
import lombok.Builder;

import java.util.List;

import com.kinga.followtask.entity.TypeCanal;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class IssueCanalMessagesDto {
    private Long canalId;
    private String canalPseudo;
    private TypeCanal typeCanal;
    private String linkMode;
    private List<IssueMessageDto> messages;
}