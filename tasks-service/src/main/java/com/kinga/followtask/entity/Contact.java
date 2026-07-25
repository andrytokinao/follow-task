package com.kinga.followtask.entity;

import com.kinga.followtask.entity.enumapp.TypeContact;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Contact {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "user_app_id", nullable = false)
    private UserApp userApp;

    @Enumerated(value = EnumType.STRING)
    @Column(nullable = false)
    private TypeContact typeContact;

    @Column(name = "contact_value", nullable = false)
    private String value;

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