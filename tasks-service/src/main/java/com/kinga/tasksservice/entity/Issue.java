package com.kinga.tasksservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
public class Issue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Date creationDate;
    private Date updateDate;
    private String summary;
    private String issueKey;
    private String description;
    private String directory;
    @ManyToMany
    private List<UserApp> observers;
    @ManyToOne
    private Status status;
    @ManyToOne
    @JoinColumn(name = "type")
    private IssueType issueType;

    @ManyToOne
    @JoinColumn(name = "assigne")
    private UserApp assigne;
    @ManyToOne
    @JoinColumn(name = "reporter")
    private UserApp reporter;
    @OneToMany
    private List<EntryTime> entryTime;
    @ManyToOne
    private Issue parent;
    @OneToMany(mappedBy = "parent")
    private List<Issue> children;
    @OneToMany(mappedBy = "issue")
    private List<Comment> comments;
    @OneToMany(mappedBy = "issue")
    private List<CustomFieldValue> values;

}
