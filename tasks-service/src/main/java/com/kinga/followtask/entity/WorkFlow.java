package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.util.LinkedList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkFlow {
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

}
