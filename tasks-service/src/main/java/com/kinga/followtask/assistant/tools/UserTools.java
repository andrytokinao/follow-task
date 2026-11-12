package com.kinga.followtask.assistant.tools;

import com.kinga.followtask.assistant.security.AssistantAuditService;
import com.kinga.followtask.assistant.security.ToolPermissionGuard;
import com.kinga.followtask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class UserTools {

    private final UserRepository userRepository;
    private final ToolPermissionGuard guard;
    private final AssistantAuditService audit;

    /** Vue minimale : jamais de mot de passe, CIN, code ou photo. */
    public record ColleagueDto(String id, String nom, String username) {}
    public record ProfileDto(String id, String nom, String username, String email, String contact) {}

    @Tool(description = "Donne le profil de l'utilisateur qui parle (nom, identifiant, email, téléphone)")
    public ProfileDto monProfil(ToolContext ctx) {
        String userId = ToolPermissionGuard.userId(ctx);
        audit.log(userId, "monProfil", null, "", true);
        return userRepository.findById(userId)
                .map(u -> new ProfileDto(u.getId(), u.getFullName(), u.getUsername(),
                        u.getEmail(), u.getContact()))
                .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));
    }

    @Tool(description = "Recherche un collègue par nom, prénom ou identifiant, pour obtenir son id "
            + "(utile avant d'assigner une tâche). Retourne 10 résultats maximum")
    public List<ColleagueDto> rechercherCollegue(
            @ToolParam(description = "Nom, prénom ou identifiant") String recherche,
            ToolContext ctx) {
        String userId = ToolPermissionGuard.userId(ctx);
        guard.require(userId, "USER_SEARCH", null);

        if (recherche == null || recherche.isBlank()) return List.of();
        String terme = "%" + recherche.trim().toLowerCase() + "%";

        List<ColleagueDto> result = userRepository
                .rechercher(terme, false, PageRequest.of(0, 10, Sort.by("lastName", "firstName")))
                .getContent().stream()
                .map(u -> new ColleagueDto(u.getId(), u.getFullName(), u.getUsername()))
                .toList();

        audit.log(userId, "rechercherCollegue", null, recherche, true);
        return result;
    }
}