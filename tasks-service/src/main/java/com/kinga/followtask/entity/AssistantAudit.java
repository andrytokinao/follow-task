package com.kinga.followtask.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "assistant_audit", indexes = {
        @Index(name = "idx_audit_user", columnList = "user_id"),
        @Index(name = "idx_audit_created", columnList = "created_at")
})
@Getter
@NoArgsConstructor
public class AssistantAudit {

    private static final int DETAILS_MAX = 2000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "tool")
    private String tool;

    @Column(name = "projet_id")
    private String projetId;

    @Column(name = "details", length = DETAILS_MAX)
    private String details;

    @Column(name = "success", nullable = false)
    private boolean success;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public AssistantAudit(String userId, String tool, String projetId,
                          String details, boolean success, Instant createdAt) {
        this.userId = userId;
        this.tool = tool;
        this.projetId = projetId;
        this.details = (details != null && details.length() > DETAILS_MAX)
                ? details.substring(0, DETAILS_MAX) : details;
        this.success = success;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }
}