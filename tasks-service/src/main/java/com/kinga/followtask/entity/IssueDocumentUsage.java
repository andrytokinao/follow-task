package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "issuedocumentusage")
@Data
public class IssueDocumentUsage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private DocumentUsageType usageType;

    @ManyToOne
    private Issue issue;

    @ManyToOne
    private Document document;
}
