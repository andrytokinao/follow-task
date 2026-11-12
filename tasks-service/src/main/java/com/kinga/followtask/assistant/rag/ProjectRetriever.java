package com.kinga.followtask.assistant.rag;

import com.kinga.followtask.assistant.security.ToolPermissionGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ProjectRetriever {

    private final VectorStore vectorStore;
    private final ToolPermissionGuard guard;

    public List<Document> search(String userId, String query, String projetId) {
        List<String> allowed = guard.accessibleProjectIds(userId);

        if (projetId != null && !projetId.isBlank()) {
            if (!allowed.contains(projetId)) {
                throw new AccessDeniedException("Projet non autorisé");
            }
            allowed = List.of(projetId);
        }
        if (allowed.isEmpty()) {
            return List.of();
        }

        FilterExpressionBuilder b = new FilterExpressionBuilder();
        return vectorStore.similaritySearch(SearchRequest.builder()
                .query(query)
                .topK(6)
                .filterExpression(b.in("projetId", allowed.toArray()).build())
                .build());
    }
}