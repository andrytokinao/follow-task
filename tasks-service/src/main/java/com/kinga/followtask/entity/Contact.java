package com.kinga.followtask.entity;

import com.kinga.followtask.entity.enumapp.TypeContact;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "contact", indexes = {
        @Index(name = "uk_contact_type_external", columnList = "type_contact, external_id", unique = true),
        @Index(name = "idx_contact_value", columnList = "type_contact, contact_value")
})
@Data
public class Contact {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "user_app_id")
    private UserApp userApp;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_contact", nullable = false)
    private TypeContact typeContact;

    @Column(name = "external_id", nullable = false)
    private String externalId;

    @Column(name = "contact_value")
    private String value;

    @Column(name = "display_name")
    private String displayName;

    private String label;
    @Column(name = "is_primary")
    private boolean isPrimary = false;
    @Column(name = "is_verified")
    private boolean isVerified = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
    @PreUpdate  protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}