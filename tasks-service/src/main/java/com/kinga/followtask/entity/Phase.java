package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

/**
 * Etape d'un projet : « Preliminaire », « APS », « APD », « DAO »...
 *
 * <p>Une phase regroupe des types de tache, et un type peut appartenir a
 * plusieurs phases (« Note de calcul » en APS et en APD). Chaque tache porte
 * sa propre phase ({@link Issue#getPhase()}) : c'est elle qui compte dans les
 * regroupements, pas celles de son type.</p>
 *
 * <p>Portee : une phase rattachee a un espace de travail ne sert qu'a lui ;
 * sans espace ({@link #isCommune()}), elle est partagee par tous.</p>
 *
 * <p>La phase courante d'un projet se lit sur son statut : la phase est liee
 * aux statuts du projet pendant lesquels elle est en cours ({@link #statuses}).</p>
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

    /** Espace de travail de la phase ; null pour une phase commune a tous. */
    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    /** Rang d'affichage, du debut a la fin du projet. */
    private Integer position;

    /** Statuts du projet pendant lesquels cette phase est la phase courante. */
    @ManyToMany
    @JoinTable(name = "phase_status",
            joinColumns = @JoinColumn(name = "phase_id"),
            inverseJoinColumns = @JoinColumn(name = "status_id"),
            uniqueConstraints = @UniqueConstraint(columnNames = {"phase_id", "status_id"}))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Status> statuses = new ArrayList<>();

    @ManyToMany(mappedBy = "phases")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<IssueType> issueTypes = new ArrayList<>();

    /** Partagee par tous les espaces de travail. */
    public boolean isCommune() {
        return project == null;
    }

    /** La phase est-elle proposee dans l'espace de travail donne ? */
    public boolean estVisibleDans(Long projectId) {
        return isCommune() || project.getId().equals(projectId);
    }
}
