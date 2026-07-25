package com.kinga.followtask.entity;

import com.kinga.followtask.entity.enumapp.MotifLien;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "lien_message_document", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"message_id", "document_id"})
})
@Data
public class LienMessageDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    private MessageApp message;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Enumerated(EnumType.STRING)
    @Column(name = "motif", nullable = false, length = 30)
    private MotifLien motif;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cree_par", nullable = false)
    private UserApp creePar;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private LocalDateTime creeLe;

    @Column(name = "commentaire", length = 500)
    private String commentaire;

    @PrePersist
    protected void onCreate() {
        this.creeLe = LocalDateTime.now();
    }

    public LienMessageDocument() {
    }

    public LienMessageDocument(MessageApp message, Document document, MotifLien motif, UserApp creePar) {
        this.message = message;
        this.document = document;
        this.motif = motif;
        this.creePar = creePar;
    }

}