package com.kinga.followtask.service.annuaire.doublon;

import com.kinga.followtask.dto.CorrespondanceUtilisateur;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.UserRepository;
import com.kinga.followtask.service.annuaire.ProfilExterne;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

/** Même numéro de CIN : propre à une seule personne. */
@Component
@RequiredArgsConstructor
public class DoublonParCin implements CritereDoublon {

    private final UserRepository userRepository;

    @Override
    public List<CorrespondanceUtilisateur> chercher(ProfilExterne profil) {
        if (!StringUtils.hasText(profil.cin())) {
            return List.of();
        }
        UserApp compte = userRepository.findByCin(profil.cin().trim());
        return compte == null
                ? List.of()
                : List.of(CorrespondanceUtilisateur.de(compte, "même CIN", true));
    }
}
