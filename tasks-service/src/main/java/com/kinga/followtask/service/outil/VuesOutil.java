package com.kinga.followtask.service.outil;

import com.kinga.followtask.dto.outil.DossierOutilVue;
import com.kinga.followtask.dto.outil.FichierOutilVue;
import com.kinga.followtask.dto.outil.OutilVue;
import com.kinga.followtask.entity.DossierOutil;
import com.kinga.followtask.entity.FichierOutil;
import com.kinga.followtask.entity.Outil;
import com.kinga.followtask.entity.Project;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Passage des entites du menu Outils (DT-019) a ce que voit l'ecran, avec les
 * droits de l'utilisateur deja calcules : l'ecran n'a rien a deviner.
 */
@Component
@RequiredArgsConstructor
public class VuesOutil {

    public static final String SEPARATEUR_CHEMIN = " › ";

    private final DroitsOutil droits;

    public DossierOutilVue dossier(DossierOutil dossier, ContexteOutil contexte) {
        return new DossierOutilVue(dossier.getId(), dossier.getNom(), dossier.getTypeOutil(), dossier.getPortee(),
                dossier.getParent() == null ? null : dossier.getParent().getId(),
                nomEspace(dossier.getProject()), dossier.getAuteur(), texte(dossier.getDateCreation()),
                droits.peutModifier(dossier, contexte));
    }

    /**
     * @param dossiersVisibles identifiants des dossiers visibles depuis l'espace :
     *                         un outil range dans un autre s'affiche a la racine, sans chemin
     */
    public OutilVue outil(Outil outil, List<FichierOutil> fichiers, Set<Long> dossiersVisibles, ContexteOutil contexte) {
        DossierOutil dossier = outil.getDossier();
        boolean range = dossier != null && dossiersVisibles.contains(dossier.getId());
        return new OutilVue(outil.getId(), outil.getTitre(), outil.getDescription(), outil.getTypeOutil(),
                outil.getPortee(), range ? dossier.getId() : null, range ? chemin(dossier) : "",
                outil.getUrl(), outil.getVersion(), outil.getIcone(), nomEspace(outil.getProject()), outil.getAuteur(),
                texte(outil.getDateCreation()), texte(outil.getDateModification()),
                fichiers.stream().map(f -> fichier(f, contexte)).collect(Collectors.toList()),
                droits.peutModifier(outil, contexte));
    }

    public FichierOutilVue fichier(FichierOutil fichier, ContexteOutil contexte) {
        return new FichierOutilVue(fichier.getId(), fichier.getNomOrigine(), fichier.getTypeMime(), fichier.getTaille(),
                fichier.getAuteur(), texte(fichier.getDateAjout()), droits.peutSupprimerFichier(fichier, contexte));
    }

    /** Dossiers du premier niveau jusqu'a celui-ci. */
    public List<DossierOutil> ascendance(DossierOutil dossier) {
        List<DossierOutil> ascendance = new ArrayList<>();
        for (DossierOutil d = dossier; d != null && ascendance.size() <= RangementOutil.PROFONDEUR_MAX; d = d.getParent()) {
            ascendance.add(d);
        }
        Collections.reverse(ascendance);
        return ascendance;
    }

    private String chemin(DossierOutil dossier) {
        return ascendance(dossier).stream().map(DossierOutil::getNom).collect(Collectors.joining(SEPARATEUR_CHEMIN));
    }

    private static String nomEspace(Project espace) {
        return espace == null ? null : espace.getName();
    }

    private static String texte(LocalDateTime date) {
        return date == null ? null : date.toString();
    }
}
