package com.kinga.followtask.entity;

import com.kinga.followtask.entity.enumapp.ExecutionStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "planning_event_history")
@Data
@NoArgsConstructor
public class PlanningEventHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planning_event_id", nullable = false)
    private PlanningEvent planningEvent;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ExecutionStatus status; // Ce qui s'est passé

    @Column(name = "previous_end", nullable = false)
    private LocalDateTime previousEnd; // Ancienne valeur de end avant modification

    @Column(name = "new_end", nullable = true)
    private LocalDateTime newEnd; // Nouvelle valeur (si EXTENDED)

    @Column(name = "completion_percentage", nullable = true)
    private Integer completionPercentage; // Avancement renseigné par l'utilisateur

    @Column(name = "block_reason", columnDefinition = "TEXT", nullable = true)
    private String blockReason;

    @Column(name = "note", columnDefinition = "TEXT", nullable = true)
    private String note;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "recorded_by")
    private UserApp recordedBy;
}