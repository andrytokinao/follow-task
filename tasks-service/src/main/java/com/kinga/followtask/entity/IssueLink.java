package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Lien orienté entre deux tâches : {@code source} {@link LinkType type}
 * {@code destination} (« A bloque B », « A précède B »...).
 *
 * <p>Un seul sens est enregistré ; le sens inverse (« B est bloquée par A »)
 * se lit depuis la destination. Les deux tâches peuvent appartenir à des
 * départements différents : le lien ne dépend pas de {@code Issue.project}.</p>
 *
 * <p>Un lien retiré garde sa ligne ({@code removedAt} renseigné), comme
 * {@link IssueCanalLink} ; le recréer la réactive, d'où la contrainte
 * d'unicité sur le triplet.</p>
 *
 * <p>Pas de nom de table : comme les autres entités, elle garde celui de la
 * classe ({@code issuelink} sur MySQL Windows), la table existante.</p>
 */
@Entity
@Data
@NoArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(name = "uk_issuelink", columnNames = {"source_id", "destination_id", "type"}),
        indexes = @Index(name = "idx_issuelink_destination", columnList = "destination_id, removedAt"))
public class IssueLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LinkType type;

    /** Prédécesseur. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_id", nullable = false)
    private Issue source;

    /** Successeur. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_id", nullable = false)
    private Issue destination;

    /** Contrainte de planning, pour le Gantt ; sans effet sur RELATES_TO. */
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private DependencyMode mode = DependencyMode.FINISH_TO_START;

    /** Décalage en jours entre les deux bornes ; négatif pour un chevauchement. */
    private Integer lagDays = 0;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private UserApp createdBy;

    private LocalDateTime removedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "removed_by")
    private UserApp removedBy;
}
