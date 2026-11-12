package com.kinga.followtask.assistant.security;

import com.kinga.followtask.entity.AssistantAudit;
import com.kinga.followtask.repository.AssistantAuditRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;


@Service
@RequiredArgsConstructor
@Slf4j
public class AssistantAuditService {

    private final AssistantAuditRepository repo; // table assistant_audit

    public void log(String userId, String tool, String projetId, String details, boolean success) {
        try {
            repo.save(new AssistantAudit(userId, tool, projetId, details, success, Instant.now()));
        } catch (Exception e) {
            log.error("Audit non enregistré (user={}, tool={}) : {}", userId, tool, e.getMessage());
        }
        log.info("assistant user={} tool={} projet={} ok={}", userId, tool, projetId, success);
    }
}