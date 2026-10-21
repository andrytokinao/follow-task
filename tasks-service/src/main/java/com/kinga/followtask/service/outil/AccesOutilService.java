package com.kinga.followtask.service.outil;

import com.kinga.followtask.config.CurrentUserProvider;
import com.kinga.followtask.entity.GroupeUser;
import com.kinga.followtask.entity.MemberGroupe;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.RattachementOutil;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.MemberGroupeRepository;
import com.kinga.followtask.repository.ProjectRepository;
import com.kinga.followtask.service.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Contexte d'acces au menu Outils (DT-019) : l'utilisateur connecte, l'espace
 * de travail et ses roles. Verifie a chaque appel cote serveur ; masquer un
 * bouton dans l'ecran ne protege rien.
 */
@Service
@RequiredArgsConstructor
public class AccesOutilService {

    /** Accessibilite de l'administrateur d'un espace (task-authorization, role ADMIN). */
    static final String ADMIN_ESPACE = "ADMIN";
    static final String ADMIN_SYSTEME = "CAN_ACCESS_ALL";

    private final CurrentUserProvider currentUserProvider;
    private final ProjectRepository projectRepository;
    private final MemberGroupeRepository memberGroupeRepository;
    private final AuthorizationService authorizationService;
    private final DroitsOutil droits;

    /** Contexte depuis l'espace ouvert ; refuse qui n'en est pas membre. */
    @Transactional(readOnly = true)
    public ContexteOutil depuisEspace(Long espaceId) {
        if (espaceId == null) {
            throw new IllegalArgumentException("Espace de travail manquant");
        }
        Project espace = projectRepository.findById(espaceId)
                .orElseThrow(() -> new IllegalArgumentException("Espace de travail introuvable : " + espaceId));
        return contexte(currentUserProvider.getCurrentUser(), espace);
    }

    /**
     * Contexte d'un element atteint sans passer par un espace (telechargement
     * d'un fichier) : celui de son espace, ou aucun s'il est partage avec tous.
     */
    @Transactional(readOnly = true)
    public ContexteOutil pourElement(RattachementOutil element) {
        UserApp utilisateur = currentUserProvider.getCurrentUser();
        if (element.getProject() == null) {
            return new ContexteOutil(utilisateur, null, adminSysteme(utilisateur), false);
        }
        return contexte(utilisateur, element.getProject());
    }

    /** Refuse si l'element n'est pas visible depuis l'espace du contexte. */
    public void verifierVisible(RattachementOutil element, ContexteOutil contexte) {
        boolean visible = contexte.espace() == null
                ? element.getProject() == null
                : droits.visibleDepuis(element, contexte.espace().getId());
        if (!visible) {
            throw new AccessDeniedException("Cet élément n'est pas disponible dans cet espace de travail");
        }
    }

    public void verifierModifiable(RattachementOutil element, ContexteOutil contexte) {
        if (!droits.peutModifier(element, contexte)) {
            throw new AccessDeniedException("Seuls son auteur et l'administrateur peuvent modifier ou supprimer cet élément");
        }
    }

    private ContexteOutil contexte(UserApp utilisateur, Project espace) {
        boolean adminSysteme = adminSysteme(utilisateur);
        Optional<List<String>> roles = rolesDansEspace(utilisateur, espace);
        if (roles.isEmpty() && !adminSysteme) {
            throw new AccessDeniedException("Vous n'êtes pas membre de l'espace de travail " + espace.getName());
        }
        boolean adminEspace = roles.orElse(List.of()).stream()
                .anyMatch(role -> authorizationService.resolveTaskAccessibilities(role).contains(ADMIN_ESPACE));
        return new ContexteOutil(utilisateur, espace, adminSysteme, adminEspace);
    }

    private boolean adminSysteme(UserApp utilisateur) {
        return authorizationService.hasSystemAccessibility(utilisateur, ADMIN_SYSTEME);
    }

    /** Roles de l'utilisateur dans le groupe de l'espace ; vide s'il n'en est pas membre. */
    private Optional<List<String>> rolesDansEspace(UserApp utilisateur, Project espace) {
        if (utilisateur == null || espace.getPrefix() == null) {
            return Optional.empty();
        }
        String groupe = GroupeUser.projectGroupePrefix(espace.getPrefix());
        List<MemberGroupe> adhesions = memberGroupeRepository
                .findByUserIdAndGroupeType(utilisateur.getId(), GroupeUser.PROJECT_GROUPE).stream()
                .filter(membre -> membre.getGroupe() != null && groupe.equals(membre.getGroupe().getPrefix()))
                .toList();
        if (adhesions.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(adhesions.stream()
                .filter(membre -> membre.getRoles() != null)
                .flatMap(membre -> membre.getRoles().stream())
                .toList());
    }
}
