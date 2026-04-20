package com.kinga.followtask.entity;

import com.kinga.followtask.repository.DocumentMemberRepository;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.UploadedRepository;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Formula;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.kinga.utils.KingaUtils.dateTimeFormater;

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

    @Enumerated(EnumType.STRING)
    private TypeDocument typeDocument;
    @ManyToOne
    private Project project;
    private LocalDateTime creation;
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
    @OneToMany(mappedBy = "document" , fetch = FetchType.EAGER)
    private List<Uploaded> uploadeds;
    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;
    @OneToMany(mappedBy = "document", fetch = FetchType.LAZY)
    private List<DocumentReadStatus> readStatuses;
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
    public Set<String> buildMembers() {
        if (this.typeDocument == null) {
            return new HashSet<>();
        }
        switch (this.typeDocument) {
            case EXCHANGE_DOCUMENT -> {
                if (this.members == null) {
                    return new HashSet<>();
                }
                return this.members;
            }
            case RESPONSE_DOCUMENT -> {
                if (this.parent ==  null || this.parent.buildMembers() == null) {
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
 public void loadUploadeds(UploadedRepository uploadedRepository) {
        this.setUploadeds(uploadedRepository.findByDocumentId(this.getId()));
 }
  public String getCreation (){
        return this.creation == null ? "" : dateTimeFormater.format(this.creation);
  }
}
