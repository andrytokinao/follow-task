package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;

/**
 * Groupe de types de tache d'un espace de travail : « Etude », « Controle »...
 *
 * <p>Un type appartient a une phase au plus, et peut n'en avoir aucune : les
 * types crees avant les phases restent sans phase tant qu'on ne les range pas.
 * La cle etrangere est portee par le type ({@code issue_type.phase_id}).</p>
 */
@Entity
@Table(
        name = "phase",
        indexes = {
                @Index(name = "idx_phase_project", columnList = "project_id")
        }
)
@Data
@NoArgsConstructor
public class Phase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String name;

    @ManyToOne(optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @OneToMany(mappedBy = "phase")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<IssueType> issueTypes;
}
