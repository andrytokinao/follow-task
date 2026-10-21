package com.kinga.followtask.service.outil;

import com.kinga.followtask.dto.outil.DossierOutilSaisie;
import com.kinga.followtask.entity.DossierOutil;
import com.kinga.followtask.entity.enumapp.PorteeOutil;
import com.kinga.followtask.repository.DossierOutilRepository;
import com.kinga.followtask.repository.OutilRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Dossiers du menu Outils (DT-019) : creation, renommage, suppression.
 * Tout membre de l'espace cree des dossiers ; l'auteur ou l'administrateur
 * les renomme et les supprime.
 */
@Service
@RequiredArgsConstructor
public class DossierOutilService {

    private final DossierOutilRepository dossierRepository;
    private final OutilRepository outilRepository;
    private final AccesOutilService acces;
    private final RangementOutil rangement;
    private final ValidationOutil validation;

    @Transactional
    public DossierOutil enregistrer(ContexteOutil contexte, DossierOutilSaisie saisie) {
        String nom = validation.libelle(saisie.nom(), "Le nom du dossier", DossierOutil.NOM_MAX);
        DossierOutil dossier = saisie.id() == null ? nouveau(contexte, saisie) : existant(contexte, saisie.id());
        verifierNomLibre(dossier, nom);
        dossier.setNom(nom);
        return dossierRepository.save(dossier);
    }

    /** Seulement vide : on ne fait pas disparaitre d'un clic les outils des autres. */
    @Transactional
    public void supprimer(ContexteOutil contexte, Long id) {
        DossierOutil dossier = existant(contexte, id);
        if (dossierRepository.existsByParentIdAndDeletedFalse(id) || outilRepository.existsByDossierIdAndDeletedFalse(id)) {
            throw new IllegalArgumentException("Le dossier « " + dossier.getNom() + " » n'est pas vide");
        }
        dossier.setDeleted(true);
        dossierRepository.save(dossier);
    }

    /** Dossier non supprime et visible depuis l'espace du contexte. */
    @Transactional(readOnly = true)
    public DossierOutil visible(ContexteOutil contexte, Long id) {
        DossierOutil dossier = dossierRepository.findById(id)
                .filter(d -> !Boolean.TRUE.equals(d.getDeleted()))
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable : " + id));
        acces.verifierVisible(dossier, contexte);
        return dossier;
    }

    private DossierOutil nouveau(ContexteOutil contexte, DossierOutilSaisie saisie) {
        if (saisie.typeOutil() == null) {
            throw new IllegalArgumentException("Le type d'outil du dossier est obligatoire");
        }
        DossierOutil dossier = new DossierOutil();
        dossier.setTypeOutil(saisie.typeOutil());
        dossier.setPortee(saisie.portee() == null ? PorteeOutil.ESPACE : saisie.portee());
        dossier.setProject(dossier.getPortee() == PorteeOutil.ESPACE ? contexte.espace() : null);
        dossier.setAuteur(contexte.utilisateur());
        dossier.setDateCreation(LocalDateTime.now());
        DossierOutil parent = saisie.parentId() == null ? null : visible(contexte, saisie.parentId());
        rangement.verifierParent(dossier, parent);
        dossier.setParent(parent);
        return dossier;
    }

    private DossierOutil existant(ContexteOutil contexte, Long id) {
        DossierOutil dossier = visible(contexte, id);
        acces.verifierModifiable(dossier, contexte);
        return dossier;
    }

    /**
     * Pas deux dossiers de meme nom cote a cote dans un meme espace. Ceux d'un
     * autre espace ne genent pas, sauf si le dossier est partage avec tous :
     * il les cotoiera partout.
     */
    private void verifierNomLibre(DossierOutil dossier, String nom) {
        Long parentId = dossier.getParent() == null ? null : dossier.getParent().getId();
        boolean pris = dossierRepository.homonymes(dossier.getTypeOutil(), parentId, nom).stream()
                .filter(autre -> !autre.getId().equals(dossier.getId()))
                .anyMatch(autre -> dossier.getPortee() == PorteeOutil.TOUS_LES_ESPACES
                        || autre.getPortee() == PorteeOutil.TOUS_LES_ESPACES
                        || autre.getProject().getId().equals(dossier.getProject().getId()));
        if (pris) {
            throw new IllegalArgumentException("Un dossier « " + nom + " » existe déjà ici");
        }
    }
}
