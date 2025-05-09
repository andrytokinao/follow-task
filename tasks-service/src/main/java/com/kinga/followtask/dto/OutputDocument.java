package com.kinga.followtask.dto;

import com.kinga.followtask.entity.*;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.CollectionUtils;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.kinga.utils.KingaUtils.dateTimeFormater;
import static com.kinga.utils.KingaUtils.dateTimeFormaterPattern;

@Data
@NoArgsConstructor
public class OutputDocument {
    public static DateFormat SDF_H = new SimpleDateFormat("yyyy-MM-dd hh:mm");

    private Long id;
    private String titre;
    private String description;
    private TypeDocument typeDocument;
    private Project project;
    private String creation;
    private Document parent;
    private List<Document> responses;
    public List<DocumentMember> documentMembers;
    private UserApp userApp;
    private Set<String> members;
    private Issue issues;
    private List<Uploaded> uploadeds;
    public OutputDocument(Document document) {
        super();
        this.id = document.getId();
        this.titre = document.getTitre();
        this.description = document.getDescription();
        this.setCreation(document.getCreation());
        this.setProject(document.getProject());
        this.setParent(document.getParent());
        this.setResponses(document.getResponses());
        this.setDocumentMembers(document.getDocumentMembers());
        this.setMembers(document.getMembers());
        this.setIssues(document.getIssues());
        this.setUploadeds(document.getUploadeds());
        this.setUserApp(document.getUserApp());
    }
    public void setUserApp(UserApp userApp) {
        if (userApp ==  null) {
            return;
        }
        UserApp user = new UserApp();
        user.setId(userApp.getId());
        user.setPhoto(userApp.getPhoto());
        user.setUsername(userApp.getUsername());
        user.setEmail(userApp.getEmail());
        user.setLastName(userApp.getLastName());
        user.setFirstName(userApp.getFirstName());
        this.userApp = user;
    }
    public void setProject(Project project) {
        if (project == null) {
            return;
        }
        Project p = new Project();
        p.setId(project.getId());
        this.project = p;
    }
    public void setParent(Document parent) {
        if(parent == null) {
            return;
        }
        Document p = new Document();
        p.setId(parent.getId());
        this.parent = p;
    }
    public void setResponses(List<Document> responses) {};
    public void setDocumentMembers(List<DocumentMember> documentMembers) {
        /*documentMembers.forEach(documentMember -> {
            // TODO : A documenter le pipline
        });*/
    };
    public void setMembers(Set<String> members) {
        this.members = members;
    }
    public void setIssues(Issue issues) {
        if(issues == null) {
            return;
        }
        Issue issue = new Issue();
        issue.setId(issues.getId());
        this.issues = issue;
    }
    public void setUploadeds(List<Uploaded> uploadeds) {
        if (!CollectionUtils.isEmpty(uploadeds)) {
            System.out.println("uploaded for "+getTitre() +" is not umpty");

            this.uploadeds = uploadeds.stream().map(uploaded -> new Uploaded(uploaded.getName(),uploaded.getPath())).collect(Collectors.toList());
        } else {
            System.out.println("uploaded for "+getTitre() +" is umpty");
        }
    }

    public void setCreation(LocalDateTime date) {
        if (date != null )
            this.creation = dateTimeFormater.format(date);
    }
}
