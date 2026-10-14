package com.kinga.followtask.service.annuaire.doublon;

import com.kinga.followtask.dto.CorrespondanceUtilisateur;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.UserRepository;
import com.kinga.followtask.service.annuaire.ProfilExterne;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Même nom et même prénom : peut-être la même personne, peut-être un homonyme.
 *
 * <p>Le critère n'est donc pas bloquant — l'administrateur tranche. Il tolère
 * les écarts courants d'une saisie à l'autre : casse, accents, nom et prénom
 * inversés, prénoms multiples dont seul le premier a été repris.</p>
 */
@Component
@RequiredArgsConstructor
public class DoublonParNom implements CritereDoublon {

    private static final String CRITERE = "même nom et prénom";

    private final UserRepository userRepository;

    @Override
    public List<CorrespondanceUtilisateur> chercher(ProfilExterne profil) {
        if (!StringUtils.hasText(profil.nom()) || !StringUtils.hasText(profil.prenoms())) {
            return List.of();
        }
        List<CorrespondanceUtilisateur> trouves = new ArrayList<>();
        ajouter(trouves, profil.nom(), profil.prenoms());
        // Nom et prénom inversés : erreur de saisie fréquente d'un outil à l'autre.
        ajouter(trouves, profil.prenoms(), profil.nom());
        return trouves;
    }

    private void ajouter(List<CorrespondanceUtilisateur> trouves, String nom, String prenoms) {
        String premierPrenom = premierMot(prenoms);
        for (UserApp compte : userRepository.findByLastNameIgnoreCase(nom.trim())) {
            boolean dejaVu = trouves.stream().anyMatch(c -> c.id().equals(compte.getId()));
            if (!dejaVu && premierMot(compte.getFirstName()).equals(premierPrenom)) {
                trouves.add(CorrespondanceUtilisateur.de(compte, CRITERE, false));
            }
        }
    }

    /** Premier mot, sans accents ni casse : « Éric Jean » et « eric » se rejoignent. */
    private static String premierMot(String valeur) {
        if (valeur == null) {
            return "";
        }
        String propre = Normalizer.normalize(valeur, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim();
        return propre.split("[\\s-]+")[0];
    }
}
