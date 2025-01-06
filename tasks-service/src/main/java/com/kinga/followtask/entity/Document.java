package com.kinga.followtask.entity;

import jakarta.persistence.*;

import java.util.Date;
import java.util.List;

@Entity
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private String titre;
    private String description;
    private TypeDocument typeDocument;
    private Date creation;
    @ManyToOne
    private UserApp userApp;
    @ManyToOne
    private Issue issues;
  @OneToMany(mappedBy = "document")
    private List<Uploaded> uploadeds;
}
