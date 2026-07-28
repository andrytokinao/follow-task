package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@Table(name = "canal_contact", uniqueConstraints = {
        @UniqueConstraint(name = "uk_canal_contact", columnNames = {"canall_id", "contact_id"})
})
public class CanalContact {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canall_id", nullable = false)
    private Canall canall;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id", nullable = false)
    private Contact contact;

    private boolean admin;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt = LocalDateTime.now();
}