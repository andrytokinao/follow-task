package com.kinga.followtask.assistant.tools;

import com.kinga.followtask.assistant.security.AssistantAuditService;
import com.kinga.followtask.assistant.security.ToolPermissionGuard;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ProjectTools {

    private final ProjectService projectService;
    private final ToolPermissionGuard guard;
    private final AssistantAuditService audit;

    @Tool(description = "Liste les projets auxquels l'utilisateur a accès")
    public List<Project> mesProjets(ToolContext ctx) {
        String userId = ToolPermissionGuard.userId(ctx);
        audit.log(userId, "mesProjets", null, "", true);
        return projectService.getProjectByUser(userId);
    }

    @Tool(description = "Donne l'avancement d'un projet : tâches par statut, retards, prochaines échéances")
    public Project avancementProjet(
            @ToolParam(description = "Identifiant du projet") String projetId,
            ToolContext ctx) {
        String userId = ToolPermissionGuard.userId(ctx);
        guard.require(userId, "PROJECT_READ", projetId);
        audit.log(userId, "avancementProjet", projetId, "", true);
        return projectService.getByPrefix(projetId);
    }
}