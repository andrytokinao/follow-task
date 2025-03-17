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
    private Date creation;
    @ManyToOne
    private UserApp userApp;
    @ManyToOne
    private Issue issues;
  @OneToMany(mappedBy = "document")
    private List<Uploaded> uploadeds;
}
