package com.kinga.followtask.assistant.tools;

import com.kinga.followtask.assistant.security.AssistantAuditService;
import com.kinga.followtask.assistant.security.ToolPermissionGuard;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.repository.criteria.IssueSearchCriteria;
import com.kinga.followtask.service.IssueService;
import com.kinga.followtask.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TaskTools {

    private final IssueService taskService;
    private final ToolPermissionGuard guard;
    private final AssistantAuditService audit;
    private final ProjectService projectService;

    @Tool(description = "Liste les tâches de l'utilisateur courant, filtrables par statut")
    public List<Issue> mesTaches(@ToolParam(required = false) String statut) {
        IssueSearchCriteria criteria = null;
        return taskService.searchIssues(criteria);
    }

    @Tool(description = "Crée une tâche dans un projet. Demander confirmation avant d'appeler.")
    public Issue creerTache(String userId,String projectPrefix, String titre, String assigneId,String summary,String description, String echeance)  {
        guard.require(userId,"TASK_CREATE", projectPrefix);
        Project project = projectService.getByPrefix(projectPrefix);
        Issue issue = new Issue();
        IssueType issueType = null;

        Issue t = null;
        try {
            t = taskService.saveIssue(issue);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        //audit.log("creerTache", projectPrefix, t.getId());
        return t;
    }
}