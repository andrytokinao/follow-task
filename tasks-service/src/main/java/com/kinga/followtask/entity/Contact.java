package com.kinga.followtask.entity;

import com.kinga.followtask.entity.enumapp.TypeContact;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "contact", indexes = {
        @Index(name = "idx_contact_type_value", columnList = "type_contact, contact_value", unique = true)
})
@Data
public class Contact {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "user_app_id", nullable = true)
    private UserApp userApp;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "type_contact", nullable = false)
    private TypeContact typeContact;

    /** Identifiant externe : jid WhatsApp, email, numéro de téléphone... */
    @Column(name = "contact_value", nullable = false)
    private String value;

    /** Nom affiché tel que renvoyé par le provider (pushName, nom du contact WhatsApp...). */
    @Column(name = "display_name")
    private String displayName;

    private String label;
    private boolean isPrimary;
    private boolean isVerified;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}