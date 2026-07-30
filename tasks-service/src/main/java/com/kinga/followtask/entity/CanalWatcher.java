package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@Table(name = "canal_watcher", uniqueConstraints = {
        @UniqueConstraint(name = "uk_canal_watcher", columnNames = {"canall_id", "user_app_id"})
})
public class CanalWatcher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canall_id", nullable = false)
    private Canall canall;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_app_id", nullable = false)
    private UserApp userApp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "granted_by_id")
    private UserApp grantedBy;

    @Column(name = "granted_at", nullable = false)
    private LocalDateTime grantedAt = LocalDateTime.now();

    private String reason;
}