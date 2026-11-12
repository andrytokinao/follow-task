package com.kinga.followtask.assistant.tools;

import com.kinga.followtask.assistant.rag.ProjectRetriever;
import com.kinga.followtask.assistant.security.AssistantAuditService;
import com.kinga.followtask.assistant.security.ToolPermissionGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DocumentTools {

    private final ProjectRetriever retriever;
    private final AssistantAuditService audit;

    @Tool(description = "Recherche dans les documents des projets (DOCX, XLSX, PDF, plans, notes de réunion). Retourne des extraits avec leur source")
    public List<DocExcerpt> chercherDocuments(
            @ToolParam(description = "Question ou mots-clés") String requete,
            @ToolParam(required = false, description = "Limiter à un projet") String projetId,
            ToolContext ctx) {
        String userId = ToolPermissionGuard.userId(ctx);
        audit.log(userId, "chercherDocuments", projetId, requete, true);
        return retriever.search(userId, requete, projetId).stream()
                .map(d -> new DocExcerpt(
                        (String) d.getMetadata().get("fichier"),
                        (String) d.getMetadata().get("projetId"),
                        d.getText()))
                .toList();
    }

    public record DocExcerpt(String fichier, String projetId, String extrait) {}
}