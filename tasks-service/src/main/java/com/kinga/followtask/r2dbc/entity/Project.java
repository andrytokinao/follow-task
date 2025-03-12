package com.kinga.followtask.r2dbc.entity;

import com.kinga.followtask.entity.*;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.relational.core.mapping.Table;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table
public class Project {
    public static String BASE_DIRECTORY = "FOLLOW_TASK";
    public static String DEFAULT_PREFIX = "TASK";
    private Long id;
    private String name;
    private String prefix;
    private String description;
    private Integer dernierNumero ;
    private String path;
    private String statusConfig;
    private DomainActivity domainActivity;
    private List<IssueType> issueTypes;
    private List<WorkFlow> workFlows;
    private List<Event> events;
    private List<Issue> issues;

    @Override
    public String toString () {
        return "Project{" +
                "id=" + id +
                ", name='" + name + '\'' +
                '}';
    }
}
