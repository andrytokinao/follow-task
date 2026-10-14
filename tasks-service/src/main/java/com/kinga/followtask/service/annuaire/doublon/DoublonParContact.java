package com.kinga.followtask.service.annuaire.doublon;

import com.kinga.followtask.dto.CorrespondanceUtilisateur;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.UserRepository;
import com.kinga.followtask.service.annuaire.ProfilExterne;
import com.kinga.utils.KingaUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * Même téléphone. Le numéro est nettoyé comme le fait {@code UserService} avant
 * d'enregistrer, sans quoi « 032 89 157 67 » ne retrouverait pas « 0328915767 ».
 */
@Component
@RequiredArgsConstructor
public class DoublonParContact implements CritereDoublon {

    private final UserRepository userRepository;

    @Override
    public List<CorrespondanceUtilisateur> chercher(ProfilExterne profil) {
        String telephone = profil.telephone();
        if (!StringUtils.hasText(telephone) || !KingaUtils.isValidPhoneNumber(telephone)) {
            return List.of();
        }
        UserApp compte = userRepository.findByContact(KingaUtils.cleanPhonNumber(telephone));
        return compte == null
                ? List.of()
                : List.of(CorrespondanceUtilisateur.de(compte, "même téléphone", true));
    }
}
