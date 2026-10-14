package com.kinga.followtask.service.annuaire.doublon;

import com.kinga.followtask.dto.ApercuImportAnnuaire.Verdict;
import com.kinga.followtask.dto.CorrespondanceUtilisateur;
import com.kinga.followtask.service.annuaire.ProfilExterne;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Passe un profil au crible de tous les {@link CritereDoublon} déclarés et en
 * tire un verdict.
 */
@Component
@RequiredArgsConstructor
public class DetecteurDoublons {

    private final List<CritereDoublon> criteres;

    public List<CorrespondanceUtilisateur> chercher(ProfilExterne profil) {
        List<CorrespondanceUtilisateur> trouves = new ArrayList<>();
        for (CritereDoublon critere : criteres) {
            trouves.addAll(critere.chercher(profil));
        }
        return trouves;
    }

    /**
     * Un seul critère bloquant suffit à écarter la fiche ; un critère faible
     * seul demande confirmation.
     */
    public static Verdict verdict(List<CorrespondanceUtilisateur> correspondances) {
        if (correspondances.stream().anyMatch(CorrespondanceUtilisateur::bloquante)) {
            return Verdict.DEJA_PRESENT;
        }
        return correspondances.isEmpty() ? Verdict.NOUVEAU : Verdict.A_CONFIRMER;
    }
}
