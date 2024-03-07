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
public class Status {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String displayName;
    private Integer index;
    private String iconeFile;
    @ManyToMany
    private List<IssueType> types;
    @OneToMany(mappedBy = "to")
    private List<CrossingStatus> fromeStatus;
    @OneToMany(mappedBy = "from")
    private List<CrossingStatus> acctionPossible;
    @OneToMany
    private List<Issue> issues;

}

