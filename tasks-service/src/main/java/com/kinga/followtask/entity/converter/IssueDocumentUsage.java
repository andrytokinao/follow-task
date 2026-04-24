package com.kinga.followtask.entity.converter;

import com.kinga.followtask.entity.Document;
import com.kinga.followtask.entity.DocumentUsageType;
import com.kinga.followtask.entity.Issue;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Table(name = "issuedocumentusage")
@Data
public class IssueDocumentUsage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private DocumentUsageType usageType;

    @Convert(converter = TypeDocumentListConverter.class )
    private List<DocumentUsageType> usages;

    @ManyToOne
    private Issue issue;

    @ManyToOne
    private Document document;
}
