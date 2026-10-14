package com.kinga.followtask.service.annuaire.doublon;

import com.kinga.followtask.dto.CorrespondanceUtilisateur;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.UserRepository;
import com.kinga.followtask.service.annuaire.ProfilExterne;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

/** Même email : c'est la même personne, et {@code UserService.save} le refuserait. */
@Component
@RequiredArgsConstructor
public class DoublonParEmail implements CritereDoublon {

    private final UserRepository userRepository;

    @Override
    public List<CorrespondanceUtilisateur> chercher(ProfilExterne profil) {
        if (!StringUtils.hasText(profil.email())) {
            return List.of();
        }
        UserApp compte = userRepository.findByEmail(profil.email().trim());
        return compte == null
                ? List.of()
                : List.of(CorrespondanceUtilisateur.de(compte, "même email", true));
    }
}
