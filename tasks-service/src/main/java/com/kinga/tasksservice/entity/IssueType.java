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
public class IssueType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
    @ManyToMany
    private List<Project> project;

    @OneToMany(mappedBy = "type")
    private List<Issue> issues;
    @ManyToMany
    private List<CostumField> costumFields;
    @ManyToMany
    private List<State> states;

}
