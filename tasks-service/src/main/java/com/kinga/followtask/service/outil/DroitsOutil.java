package com.kinga.followtask.service.outil;

import com.kinga.followtask.entity.FichierOutil;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.RattachementOutil;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.PorteeOutil;
import org.springframework.stereotype.Component;

/**
 * Regles d'acces du menu Outils (DT-019), sans base de donnees.
 *
 * <ul>
 *   <li>Tout membre d'un espace voit les elements partages avec tous les
 *   espaces et ceux de son espace, et peut en creer.</li>
 *   <li>Modifier ou supprimer : l'auteur, l'administrateur de l'application,
 *   ou l'administrateur de l'espace pour un element de cet espace. Un element
 *   partage avec tous n'appartient a aucun espace : l'administrateur d'un
 *   espace n'y touche pas.</li>
 *   <li>Supprimer un fichier : en plus, l'auteur de l'outil qui le porte.</li>
 * </ul>
 */
@Component
public class DroitsOutil {

    public boolean visibleDepuis(RattachementOutil element, Long espaceId) {
        return element.getPortee() == PorteeOutil.TOUS_LES_ESPACES
                || (element.getProject() != null && element.getProject().getId().equals(espaceId));
    }

    public boolean peutModifier(RattachementOutil element, ContexteOutil contexte) {
        return estAuteur(element.getAuteur(), contexte.utilisateur())
                || contexte.adminSysteme()
                || (contexte.adminEspace()
                    && element.getPortee() == PorteeOutil.ESPACE
                    && memeEspace(element.getProject(), contexte.espace()));
    }

    public boolean peutSupprimerFichier(FichierOutil fichier, ContexteOutil contexte) {
        return estAuteur(fichier.getAuteur(), contexte.utilisateur())
                || peutModifier(fichier.getOutil(), contexte);
    }

    private boolean estAuteur(UserApp auteur, UserApp utilisateur) {
        return auteur != null && utilisateur != null
                && auteur.getId() != null && auteur.getId().equals(utilisateur.getId());
    }

    private boolean memeEspace(Project a, Project b) {
        return a != null && b != null && a.getId() != null && a.getId().equals(b.getId());
    }
}
