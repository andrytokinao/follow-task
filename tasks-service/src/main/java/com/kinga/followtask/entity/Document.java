package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private String titre;
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String description;
    private TypeDocument typeDocument;
    @ManyToOne
    private Project project;
    private Date creation;
    @ManyToOne
    private Document parent;
    @OneToMany(mappedBy = "parent")
    private List<Document> responses;
    @OneToMany( mappedBy = "document")
    public List<DocumentMember> documentMembers;
    @ManyToOne
    private UserApp userApp;
    @Transient
    private List<String> members;
    @ManyToOne
    private Issue issues;
    @OneToMany(mappedBy = "document")
    private List<Uploaded> uploadeds;
}
