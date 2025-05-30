package com.kinga.followtask.entity;

import ch.qos.logback.classic.pattern.DateConverter;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;

@Entity
@Data
@NoArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String titre ;
    @ManyToOne(fetch = FetchType.EAGER)
    private Project project;
    private String message;
    @Convert(converter = StringSetConverter.class)
    private Set<String> userIds;
    @Convert(converter = StringListConverter.class)
    private List<String> seenUserIds = new ArrayList<>();
    @Convert(converter = StringListConverter.class)
    private List<String> readUserIds = new ArrayList<>();
    @ManyToOne
    private ActionGroupe action;

    public Set<String> getUserIds() {
        if (this.userIds == null)
            this.userIds = new HashSet<>();
        return userIds;
    }

    public List<String> getSeenUserIds() {
        if (this.seenUserIds == null)
            this.seenUserIds = new ArrayList<>();
        return seenUserIds;
    }

    public List<String> getReadUserIds() {
        if (this.readUserIds == null)
            this.readUserIds = new ArrayList<>();
        return readUserIds;
    }
    public List<String> getIssueLinks(){
        return Arrays.asList("/working",project.getPrefix(),"issue",action.getIssue().getIssueKey(),"details");

    }
}
