package com.kinga.followtask.entity;

import com.kinga.utils.KingaUtils;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.File;
import java.time.LocalDateTime;
import java.util.*;


@Entity
@Data
@NoArgsConstructor
public class Issue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private LocalDateTime creationDate;
    private LocalDateTime updateDate;
    private String summary;
    private String issueKey;
    @Lob
    @Column(nullable = true,columnDefinition = "LONGTEXT")
    private String description;
    private String directory;
    @ManyToMany
    private List<UserApp> observers;
    @Convert(converter = StringSetConverter.class)
    private Set<String> observerIds = new HashSet<>();
    @ManyToOne
    private Status status;
    @ManyToOne
    @JoinColumn(name = "type")
    private IssueType issueType;
    @OneToMany(mappedBy = "issues")
    private List<Document>  documents;
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
    @OneToMany(mappedBy = "issue")
    private List<Event> events;
    @OneToMany(mappedBy = "issue")
    private List<IssueLabels> labels = new ArrayList<>();
    @ManyToOne
    private Project project;
    public String getEncodedPath(){
        return KingaUtils.encodeText(this.getDirectory());
    }
    public Set<String> addObserverIds(String observerId) {
        if (this.observerIds == null) {
            this.observerIds = new HashSet<>();
        }
        this.observerIds.add(observerId);
        return this.observerIds;
    }

}
