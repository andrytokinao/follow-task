package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.util.LinkedList;
import java.util.List;

/**
 * Flux de travail : statuts possibles d'un type de tache et transitions.
 *
 * <p>Portee : un flux rattache a un espace de travail ne sert qu'a lui ;
 * sans espace ({@link #isCommun()}), il est propose a tous.</p>
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkFlow {
    /** Flux donne aux types qui n'en ont pas ; toujours commun. */
    public static final String NOM_PAR_DEFAUT = "Default workflow";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @ManyToOne
    private Project project;
    private boolean active;
    private String statesIds;
    /** positions des noeuds du diagramme, au format JSON : {"<statusId>":{"x":0,"y":0}} */
    // TODO : Ajouts dans le versionning de la base de donne
    @Lob
    @Column(nullable = true, columnDefinition = "LONGTEXT")
    private String layout;
    @ManyToMany
    private List<Status> statuses;
    @OneToMany(mappedBy = "curentWorkFlow")
    private List<IssueType> issueTypes;
    @ManyToMany
    private List<CrossingStatus> crossingStates;
    public String addStatus(Status status){
        // todo
        return "";
    }

    /** Propose a tous les espaces de travail. */
    public boolean isCommun() {
        return project == null;
    }

    /** Le flux est-il propose dans l'espace de travail donne ? */
    public boolean estVisibleDans(Long projectId) {
        return isCommun() || project.getId().equals(projectId);
    }

}
