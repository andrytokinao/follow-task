package com.kinga.followtask.service.outil;

import com.kinga.followtask.entity.DossierOutil;
import com.kinga.followtask.entity.RattachementOutil;
import com.kinga.followtask.entity.enumapp.PorteeOutil;
import com.kinga.followtask.entity.enumapp.TypeOutil;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * Regles de rangement du menu Outils (DT-019), sans base de donnees.
 *
 * <ul>
 *   <li>Un dossier ou un outil ne va que sous un dossier de son type.</li>
 *   <li>Deux niveaux de dossiers au plus sous le type : au-dela, on ne
 *   retrouve plus rien.</li>
 *   <li>Un dossier partage avec tous peut tout recevoir ; un dossier d'un
 *   espace ne recoit que des elements de ce meme espace, sinon un element
 *   partage serait invisible des autres espaces.</li>
 * </ul>
 */
@Component
public class RangementOutil {

    public static final int PROFONDEUR_MAX = 2;

    /** Refuse de ranger l'element dans le dossier ; un dossier null est la racine du type, toujours permise. */
    public void verifier(TypeOutil type, RattachementOutil element, DossierOutil dossier) {
        if (dossier == null) {
            return;
        }
        if (Boolean.TRUE.equals(dossier.getDeleted())) {
            throw new IllegalArgumentException("Le dossier « " + dossier.getNom() + " » a été supprimé");
        }
        if (dossier.getTypeOutil() != type) {
            throw new IllegalArgumentException("Le dossier « " + dossier.getNom() + " » n'est pas du même type");
        }
        if (!porteeCompatible(element, dossier)) {
            throw new IllegalArgumentException("Le dossier « " + dossier.getNom()
                    + " » est réservé à son espace de travail : un élément partagé avec tous les espaces n'y va pas");
        }
    }

    /** Un nouveau sous-dossier : regles communes, plus la profondeur. */
    public void verifierParent(DossierOutil sousDossier, DossierOutil parent) {
        verifier(sousDossier.getTypeOutil(), sousDossier, parent);
        if (parent != null && profondeur(parent) >= PROFONDEUR_MAX) {
            throw new IllegalArgumentException("Pas plus de " + PROFONDEUR_MAX + " niveaux de dossiers");
        }
        for (DossierOutil d = parent; d != null; d = d.getParent()) {
            if (sousDossier.getId() != null && sousDossier.getId().equals(d.getId())) {
                throw new IllegalArgumentException("Un dossier ne peut pas aller dans lui-même");
            }
        }
    }

    /** 1 pour un dossier directement sous le type. */
    public int profondeur(DossierOutil dossier) {
        int profondeur = 0;
        for (DossierOutil d = dossier; d != null && profondeur <= PROFONDEUR_MAX + 1; d = d.getParent()) {
            profondeur++;
        }
        return profondeur;
    }

    private boolean porteeCompatible(RattachementOutil element, DossierOutil dossier) {
        if (dossier.getPortee() == PorteeOutil.TOUS_LES_ESPACES) {
            return true;
        }
        return element.getPortee() == PorteeOutil.ESPACE
                && element.getProject() != null && dossier.getProject() != null
                && Objects.equals(element.getProject().getId(), dossier.getProject().getId());
    }
}
