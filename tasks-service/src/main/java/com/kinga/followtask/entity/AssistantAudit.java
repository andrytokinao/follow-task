package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "assistant_audit")
public class AssistantAudit {
    @Id
    @GeneratedValue
    private Long id;
    private String userId;
    private String tool;
    private String projetId;
    @Column(length = 2000) private String details;
    private boolean success;
    private Instant createdAt;

}