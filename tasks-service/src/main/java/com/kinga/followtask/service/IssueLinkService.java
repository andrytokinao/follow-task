package com.kinga.followtask.service;

import com.kinga.followtask.entity.*;
import com.kinga.followtask.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class IssueLinkService {

    private final IssueRepository issueRepository;
    private final CanalRepository canallRepository;
    private final MessagesRepository messageAppRepository;
    private final IssueCanalLinkRepository canalLinkRepository;
    private final IssueMessageLinkRepository messageLinkRepository;

    // ---------- Canal ----------

    public void linkCanalToIssue(Long canalId, Long issueId, UserApp currentUser) {
        boolean alreadyLinked = canalLinkRepository
                .findByIssueIdAndCanalIdAndEndedAtIsNull(issueId, canalId).isPresent();
        if (alreadyLinked) return;

        IssueCanalLink link = new IssueCanalLink();
        link.setIssue(issueRepository.getReferenceById(issueId));
        link.setCanal(canallRepository.getReferenceById(canalId));
        link.setSince(LocalDateTime.now());
        link.setLinkedAt(LocalDateTime.now());
        link.setLinkedBy(currentUser);
        canalLinkRepository.save(link);
    }

    public void unlinkCanalFromIssue(Long canalId, Long issueId) {
        canalLinkRepository.findByIssueIdAndCanalIdAndEndedAtIsNull(issueId, canalId)
                .ifPresent(link -> {
                    link.setEndedAt(LocalDateTime.now());
                    canalLinkRepository.save(link);
                });
    }

    // ---------- Message (par id interne) ----------

    public void linkMessageToIssue(Long messageId, Long issueId, UserApp currentUser) {
        if (messageLinkRepository.existsByIssueIdAndMessageId(issueId, messageId)) return;

        IssueMessageLink link = new IssueMessageLink();
        link.setIssue(issueRepository.getReferenceById(issueId));
        link.setMessage(messageAppRepository.getReferenceById(messageId));
        link.setLinkedAt(LocalDateTime.now());
        link.setLinkedBy(currentUser);
        messageLinkRepository.save(link);
    }

    // ---------- Message (par id externe, venant de MessagingController) ----------

    public void linkMessageByExternalId(String externalMessageId, Long issueId, UserApp currentUser) {
        MessageApp message = messageAppRepository.findByExternalMessageId(externalMessageId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Message non trouvé/synchronisé : " + externalMessageId));
        linkMessageToIssue(message.getId(), issueId, currentUser);
    }
}