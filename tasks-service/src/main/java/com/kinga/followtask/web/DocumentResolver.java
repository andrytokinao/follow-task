package com.kinga.followtask.web;

import com.kinga.followtask.dto.DocumentPage;
import com.kinga.followtask.dto.DocumentSearchInput;
import com.kinga.followtask.dto.IssuePlanningSummary;
import com.kinga.followtask.entity.DocumentUsageType;
import com.kinga.followtask.entity.converter.IssueDocumentUsage;
import com.kinga.followtask.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@RequiredArgsConstructor
@Controller
public class DocumentResolver {
    private final DocumentService documentService;

    @QueryMapping
    public DocumentPage searchDocuments(
            @Argument DocumentSearchInput search,
            @Argument Integer page,
            @Argument Integer size
    ) {
        return documentService.searchDocuments(
                search,
                page != null ? page.intValue() : 0,
                size != null ? size.intValue() : 20
        );
    }

    @QueryMapping
    public DocumentPage getMyDocuments(
            @Argument String userId,
            @Argument DocumentSearchInput search,
            @Argument Integer page,
            @Argument Integer size
    ) {
        return documentService.getMyDocuments(
                userId,
                search,
                page != null ? page : 0,
                size != null ? size : 20
        );
    }
    @QueryMapping
    public DocumentUsageType[]  documentUsageTypes(){
        return DocumentUsageType.values();
    }
    @MutationMapping
    public IssuePlanningSummary attachDocumentToIssue(@Argument Long issueId, @Argument Long documentId, @Argument List<String> usages) {
        return documentService.attachDocumentToIssue(issueId,documentId,usages);
    }
    @QueryMapping
    public List<IssueDocumentUsage> getAtachedDocumentIssue(@Argument Long documentId) {
        return documentService.getAtachedDocumentIssue(documentId);
    }

}
