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
public class State {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String iconeFile;
    @ManyToMany
    private List<IssueType> types;
    @OneToMany(mappedBy = "fin")
    private List<CrossngState> fromeStates;
    @OneToMany(mappedBy = "detut")
    private List<CrossngState> acctionPossible;

}

