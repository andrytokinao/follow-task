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
public class Issue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String summary;
    private String description;
    @ManyToMany
    private List<UserApp> observers;
    @ManyToOne
    private Status status;


    @ManyToOne
    @JoinColumn(name = "type")
    private IssueType type;

    @ManyToOne
    @JoinColumn(name = "assigne")
    private UserApp assigne;
    @ManyToOne
    @JoinColumn(name = "reporter")
    private UserApp reporter;
    @OneToMany
    private List<PasseTime> passeTime;
    @ManyToOne
    private Issue parent;
    @OneToMany(mappedBy = "parent")
    private List<Issue> children;

}
