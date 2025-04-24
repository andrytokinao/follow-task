package com.kinga.followtask.entity;

import com.kinga.followtask.repository.DocumentMemberRepository;
import com.kinga.followtask.repository.IssueRepository;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;
import java.util.stream.Collectors;

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
    @OneToMany( mappedBy = "document",fetch = FetchType.EAGER)
    public List<DocumentMember> documentMembers;
    @ManyToOne(fetch = FetchType.LAZY)
    private UserApp userApp;
    @Convert(converter = StringSetConverter.class)
    private Set<String> members;
    @ManyToOne
    private Issue issues;
    @OneToMany(mappedBy = "document")
    private List<Uploaded> uploadeds;
    public String buildMessage(){
        switch (this.typeDocument) {
            case RESPONSE_DOCUMENT -> {
                return userApp.getFirstName() + " replay " + this.getTitre();
            }
            case EXCHANGE_DOCUMENT -> {
                return userApp.getFirstName() + " created an exchange " + this.getTitre();
            }
            case MEDIA_FILES, SOURCE_FILE -> {
                return userApp.getFirstName() + " created a document " + this.getTitre();
            }
            default -> {
                return userApp.getFirstName() + " created a document " + this.getTitre();
            }
        }
    }
    public Set<String> getMembers(DocumentMemberRepository documentMemberRepository, IssueRepository issueRepository) {
        switch (this.typeDocument) {
            case EXCHANGE_DOCUMENT -> {
                if (this.members == null) {
                    return new HashSet<>();
                }
                return this.members;
            }
            case RESPONSE_DOCUMENT -> {
                if (this.parent ==  null || this.parent.getMembers() == null ) {
                    return new HashSet<>();
                }
                return this.parent.getMembers();
            }
            default -> {
                if (issues == null || issues.getObserverIds() == null) {
                    return new HashSet<>();
                }
                return issues.getObserverIds();
            }
        }
    }
}
