package com.kinga.followtask.service;

import com.kinga.followtask.dto.IssueCanalMessagesDto;
import com.kinga.followtask.entity.Canall;
import com.kinga.followtask.entity.MessageApp;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.IssueCanalLinkRepository;
import com.kinga.followtask.repository.MessagesRepository;
import com.kinga.followtask.service.messaging.dto.IssueMessageDto;
import com.kinga.followtask.service.messaging.dto.MediaType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IssueMessageService {

    private final MessagesRepository messageAppRepository;
    private final IssueCanalLinkRepository canalLinkRepository;

    public List<IssueCanalMessagesDto> getMessagesGroupedByCanal(Long issueId, UserApp currentUser) {
        List<MessageApp> allMessages = messageAppRepository.findVisibleMessagesForIssue(issueId);
        allMessages.sort(Comparator.comparing(MessageApp::getCreated));

        return allMessages.stream()
                .collect(Collectors.groupingBy(
                        MessageApp::getCanall,
                        LinkedHashMap::new,
                        Collectors.toList()))
                .entrySet().stream()
                .map(entry -> toDto(entry.getKey(), entry.getValue(), issueId, currentUser))
                .toList();
    }

    private IssueCanalMessagesDto toDto(Canall canal, List<MessageApp> messages, Long issueId, UserApp currentUser) {
        boolean isFullLink = canalLinkRepository
                .findByIssueIdAndCanalIdAndEndedAtIsNull(issueId, canal.getId())
                .isPresent();

        List<IssueMessageDto> messageDtos = messages.stream()
                .sorted(Comparator.comparing(MessageApp::getCreated))
                .map(m -> toMessageDto(m, currentUser))
                .toList();

        return IssueCanalMessagesDto.builder()
                .canalId(canal.getId())
                .canalPseudo(canal.getPseudo())
                .typeCanal(canal.getTypeCanal())
                .linkMode(isFullLink ? "FULL_CANAL" : "SELECTED_MESSAGES")
                .messages(messageDtos)
                .build();
    }

    private IssueMessageDto toMessageDto(MessageApp m, UserApp currentUser) {
        String displayName = m.getSender() != null
                ? m.getSender().getFirstName()          // à adapter selon le vrai getter
                : m.getFallbackSenderName();

        boolean fromMe = m.getSender() != null && currentUser != null
                && m.getSender().getId().equals(currentUser.getId());

        return IssueMessageDto.builder()
                .id(m.getId())
                .externalMessageId(m.getExternalMessageId())
                .text(m.getText())
                .mediaType(MediaType.fromString(m.getMediaType()))
                .senderExternalId(m.getSender() != null ? m.getSender().getId() : null)
                .senderDisplayName(displayName)
                .fromMe(fromMe)
                .createdAt(m.getCreated())
                .build();
    }
}