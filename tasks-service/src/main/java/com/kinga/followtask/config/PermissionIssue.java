package com.kinga.followtask.config;

import com.kinga.followtask.entity.enumapp.IssueRole;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Correspondance entre le role d'un membre sur une issue ({@link IssueRole})
 * et un role d'acces, distinguee selon la portee :
 * l'issue elle-meme ({@code self}) ou ses sous-taches ({@code descendants}).
 *
 * <p>Par defaut l'assigne travaille sur son issue sans pouvoir la reassigner,
 * et gere toutes les sous-taches qui en dependent.</p>
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "issue-authorization")
public class PermissionIssue {
    /**
     * Roles propres aux issues : ils n'apparaissent pas parmi les roles
     * attribuables dans un espace de travail (task-authorization).
     */
    private List<RoleApp> roles = new ArrayList<>();
    /** Adhesion posee sur une demande racine (issue master). */
    private Scope master = new Scope();
    /** Adhesion posee sur une sous-issue. */
    private Scope child = new Scope();

    public Optional<RoleApp> getRoleByName(String roleName) {
        return roles.stream()
                .filter(role -> role.getName().equals(roleName))
                .findFirst();
    }

    @Data
    public static class Scope {
        /** Role sur l'issue ou l'adhesion est posee. */
        private Map<IssueRole, String> self = new HashMap<>();
        /** Role sur chacune de ses sous-issues, a toute profondeur. */
        private Map<IssueRole, String> descendants = new HashMap<>();
    }
}
