package com.kinga.tasksservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.jdbc.Work;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    public static String BASE_DIRECTORY = "FOLOW_TASK";
    public static String DEFAULT_PREFIX = "TASK";

    public static String CONFIG_STATE1 = "create";
    public static String CONFIG_STATE2 = "issue-type";
    public static String CONFIG_STATE3 ="create_work-flow";
    public static String CONFIG_STATE4 ="config_work-flow";
    public static String CONFIG_OK ="OK";


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String prefix;
    private Integer dernierNumero ;
    private String path;
    private String statusConfig;
    @OneToMany(mappedBy = "project")
    private List<IssueType> issueTypes;
    @OneToMany(mappedBy = "project")
    private List<WorkFlow> workFlows;

}
