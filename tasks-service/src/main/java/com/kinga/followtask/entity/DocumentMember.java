package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "document_members")
public class DocumentMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private Document document;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserApp user;

}
