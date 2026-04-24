package com.kinga.followtask.entity;

import ch.qos.logback.classic.spi.Configurator;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "planning_event_execution")
@Data
@NoArgsConstructor
public class PlanningEventExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planning_event_id", nullable = false)
    private PlanningEvent planningEvent;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Configurator.ExecutionStatus status;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt = LocalDateTime.now();

    @Column(name = "completion_percentage")
    private Integer completionPercentage;

    @Column(name = "block_reason", columnDefinition = "TEXT")
    private String blockReason;

    @JoinColumn(name = "postponed_to")
    @ManyToOne(fetch = FetchType.LAZY)
    private PlanningEvent postponedTo;

    @Column(name = "extended_minutes")
    private Integer extendedMinutes; // Si prolongé, de combien de minutes

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @ManyToOne
    @JoinColumn(name = "recorded_by")
    private UserApp recordedBy;
}
