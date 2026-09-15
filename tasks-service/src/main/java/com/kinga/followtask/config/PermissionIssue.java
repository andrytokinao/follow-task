package com.kinga.followtask.config;

import com.kinga.followtask.entity.enumapp.IssueRole;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * Correspondance entre le role d'un membre sur une issue ({@link IssueRole})
 * et un role de {@code task-authorization}.
 *
 * <p>Le role obtenu vaut pour l'issue ou l'adhesion est posee et pour toute
 * sa descendance : l'assigne d'une demande racine en devient le gestionnaire,
 * sous-taches comprises.</p>
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "issue-authorization")
public class PermissionIssue {
    /** Adhesion posee sur une demande racine (issue master). */
    private Map<IssueRole, String> master = new HashMap<>();
    /** Adhesion posee sur une sous-issue. */
    private Map<IssueRole, String> child = new HashMap<>();
}
