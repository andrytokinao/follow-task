package com.kinga.tasksservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private boolean active;
    @ManyToMany
    private List<Status> states;
    @OneToMany(mappedBy = "curentWorkFlow")
    private List<IssueType> issueTypes;
    @ManyToMany
    private List<CrossingStatus> crossingStates;

}
