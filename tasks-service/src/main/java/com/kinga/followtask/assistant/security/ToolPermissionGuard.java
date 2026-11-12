package com.kinga.followtask.assistant.security;

import com.kinga.followtask.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ToolPermissionGuard {

    private final PermissionService permissionService; // votre service existant

    /** Lève une exception si l'utilisateur n'a pas le droit. */
    public void require(String userId, String permission, String projetId) {
        if (!permissionService.has(userId, permission, projetId)) {
            throw new AccessDeniedException(
                    "Action non autorisée : " + permission + " sur le projet " + projetId);
        }
    }

    /** Projets visibles par l'utilisateur (sert aussi au filtre RAG). */
    public List<String> accessibleProjectIds(String userId) {
      //  return permissionService.projectIdsFor(userId);
      return   new ArrayList<>();
    }

    /** Récupère l'identité transmise via ToolContext, jamais via le modèle. */
    public static String userId(ToolContext ctx) {
        return (String) ctx.getContext().get("userId");
    }
}