package com.kinga.followtask.service.rappel;

import com.kinga.followtask.entity.GroupeUser;
import com.kinga.followtask.entity.MemberGroupe;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.MemberGroupeRepository;
import com.kinga.followtask.service.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

/**
 * Personnes a qui l'on rappelle leur planning : les ouvriers.
 *
 * Un ouvrier est assignable dans au moins un espace de travail (TEAM_MEMBER,
 * TEAM_MEMBER_ASSIGN) et n'encadre nulle part. Encadrer, c'est voir l'agenda de
 * l'equipe dans un espace (PROJECT_MANAGER, et ADMIN qui l'inclut), ou porter un
 * role systeme de pilotage (direction, administration des projets ou du systeme).
 *
 * La regle porte sur les accessibilites et non sur les noms de roles : un role
 * ajoute plus tard dans application.yml se range de lui-meme du bon cote.
 */
@Component
@RequiredArgsConstructor
public class PopulationOuvriers {

    static final String ASSIGNABLE = "CAN_ASSIGNABLE";
    static final String AGENDA_EQUIPE = "CAN_VIEW_TEAM_AGENDA";
    static final Set<String> PILOTAGE_SYSTEME = Set.of("CAN_VIEW_DIRECTION", "CAN_CREATE_PROJECT");

    private final MemberGroupeRepository memberGroupeRepository;
    private final AuthorizationService authorizationService;

    public boolean estOuvrier(UserApp user) {
        if (user == null || !user.estActif()) {
            return false;
        }
        if (PILOTAGE_SYSTEME.stream().anyMatch(a -> authorizationService.hasSystemAccessibility(user, a))) {
            return false;
        }
        boolean assignable = false;
        for (MemberGroupe membre : memberGroupeRepository.findByUserIdAndGroupeType(user.getId(), GroupeUser.PROJECT_GROUPE)) {
            for (String role : membre.getRoles() == null ? List.<String>of() : membre.getRoles()) {
                Set<String> accessibilites = authorizationService.resolveTaskAccessibilities(role);
                if (accessibilites.contains(AGENDA_EQUIPE)) {
                    return false;
                }
                assignable |= accessibilites.contains(ASSIGNABLE);
            }
        }
        return assignable;
    }
}
