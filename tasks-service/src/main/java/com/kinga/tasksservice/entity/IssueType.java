package com.kinga.tasksservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IssueType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String prefix;
    @ManyToOne
    private Icone icone;
    @ManyToOne
    private Project project;

    @OneToMany(mappedBy = "issueType")
    private List<Issue> issues;
    @OneToMany(mappedBy = "issueType")
    private List<UsingCustomField> usingCustomFields;
    @ManyToOne
    private WorkFlow curentWorkFlow;

}
