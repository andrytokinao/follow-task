package com.kinga.tasksservice.entity;

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
    private Integer id;
    private String name;
    @ManyToOne
    private Project project;
    private boolean active;
    private String statesIds;
    @ManyToMany
    private List<Status> statuses;
    @OneToMany(mappedBy = "curentWorkFlow")
    private List<IssueType> issueTypes;
    @ManyToMany
    private List<CrossingStatus> crossingStates;

}
