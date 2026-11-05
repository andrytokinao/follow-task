package com.kinga.followtask.entity;

import com.kinga.followtask.entity.enumapp.TypeContact;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

@Entity
@Table(name = "link_code")
@Data
public class LinkCode {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false) @JoinColumn(name = "user_app_id")
    private UserApp userApp;

    @Enumerated(EnumType.STRING) @Column(name = "type_contact", nullable = false)
    private TypeContact typeContact;

    @Column(nullable = false, length = 16)
    private String code;

    @Column(name = "expires_at", nullable = false) private LocalDateTime expiresAt;
    @Column(name = "used_at")                      private LocalDateTime usedAt;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
