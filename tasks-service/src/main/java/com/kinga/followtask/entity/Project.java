package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Project {
    public static String BASE_DIRECTORY = "FOLLOW_TASK";
    public static String DEFAULT_PREFIX = "TASK";
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String prefix;
    @Lob
    @Column(nullable = true,columnDefinition = "LONGTEXT")
    private String description;
    private Integer dernierNumero ;
    private String path;
    private String statusConfig;
    @ManyToOne
    private DomainActivity domainActivity;
    @OneToMany(mappedBy = "project")
    private List<IssueType> issueTypes;
    @OneToMany(mappedBy = "project")
    private List<WorkFlow> workFlows;
    @OneToMany(mappedBy = "project")
    private List<PlanningEvent> events;
    @OneToMany(mappedBy = "project")
    private List<Issue> issues;

    @Override
    public String toString () {
        return "Project{" +
                "id=" + id +
                ", name='" + name + '\'' +
                '}';
    }
}
