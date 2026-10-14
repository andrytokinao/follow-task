package com.kinga.followtask.service.annuaire.doublon;

import com.kinga.followtask.dto.CorrespondanceUtilisateur;
import com.kinga.followtask.service.annuaire.ProfilExterne;

import java.util.List;

/**
 * Une façon de reconnaître qu'une personne a déjà un compte.
 *
 * <p>Chaque critère est un {@code @Component} : en ajouter un (matricule,
 * date de naissance…) suffit à le faire prendre en compte par
 * {@link DetecteurDoublons}.</p>
 */
public interface CritereDoublon {

    /** Comptes existants qui correspondent au profil selon ce critère ; vide sinon. */
    List<CorrespondanceUtilisateur> chercher(ProfilExterne profil);
}
