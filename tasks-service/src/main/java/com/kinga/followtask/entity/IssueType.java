package com.kinga.followtask.entity;

import com.kinga.followtask.entity.enumapp.Niveau;
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
    private String description;
    private String prefix;
    private Niveau level;
    @ManyToOne
    private Icone icone;
    @ManyToOne
    private Project project;
    private String style;
    private String color;

    @OneToMany(mappedBy = "issueType")
    private List<Issue> issues;
    @OneToMany(mappedBy = "issueType")
    private List<UsingCustomField> usingCustomFields;
    @ManyToOne
    private WorkFlow curentWorkFlow;
    @ManyToOne
    private IssueType parent ;
    @OneToMany(mappedBy = "parent")
    private List<IssueType> children;

}
