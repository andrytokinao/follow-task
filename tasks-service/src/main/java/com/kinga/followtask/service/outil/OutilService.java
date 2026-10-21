package com.kinga.followtask.service.outil;

import com.kinga.followtask.dto.outil.OutilSaisie;
import com.kinga.followtask.entity.DossierOutil;
import com.kinga.followtask.entity.Outil;
import com.kinga.followtask.entity.enumapp.PorteeOutil;
import com.kinga.followtask.entity.enumapp.TypeOutil;
import com.kinga.followtask.repository.OutilRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Outils du menu Outils (DT-019) : creation, modification, suppression.
 *
 * <p>Le type est fige a la creation : il decide du dossier racine et des
 * fichiers acceptes. A la creation, l'outil reste dans l'espace ouvert ou
 * est partage avec tous les espaces, au choix.</p>
 */
@Service
@RequiredArgsConstructor
public class OutilService {

    private final OutilRepository outilRepository;
    private final DossierOutilService dossierService;
    private final AccesOutilService acces;
    private final RangementOutil rangement;
    private final ValidationOutil validation;

    @Transactional
    public Outil enregistrer(ContexteOutil contexte, OutilSaisie saisie) {
        Outil outil = saisie.id() == null ? nouveau(contexte, saisie) : modifiable(contexte, saisie.id());
        outil.setTitre(validation.libelle(saisie.titre(), "Le titre", Outil.TITRE_MAX));
        outil.setDescription(validation.facultatif(saisie.description(), "La description", Outil.DESCRIPTION_MAX));
        outil.setVersion(validation.facultatif(saisie.version(), "La version", Outil.VERSION_MAX));
        outil.setUrl(validation.lien(saisie.url(), outil.getTypeOutil() == TypeOutil.LIEN, Outil.URL_MAX));
        appliquerPortee(outil, saisie.portee(), contexte);
        DossierOutil dossier = saisie.dossierId() == null ? null : dossierService.visible(contexte, saisie.dossierId());
        rangement.verifier(outil.getTypeOutil(), outil, dossier);
        outil.setDossier(dossier);
        if (outil.getId() != null) {
            outil.setDateModification(LocalDateTime.now());
        }
        return outilRepository.save(outil);
    }

    @Transactional
    public void supprimer(ContexteOutil contexte, Long id) {
        Outil outil = modifiable(contexte, id);
        outil.setDeleted(true);
        outil.setDateModification(LocalDateTime.now());
        outilRepository.save(outil);
    }

    /** Outil non supprime et visible depuis l'espace du contexte. */
    @Transactional(readOnly = true)
    public Outil visible(ContexteOutil contexte, Long id) {
        Outil outil = outilRepository.findById(id)
                .filter(o -> !Boolean.TRUE.equals(o.getDeleted()))
                .orElseThrow(() -> new IllegalArgumentException("Outil introuvable : " + id));
        acces.verifierVisible(outil, contexte);
        return outil;
    }

    @Transactional(readOnly = true)
    public Outil modifiable(ContexteOutil contexte, Long id) {
        Outil outil = visible(contexte, id);
        acces.verifierModifiable(outil, contexte);
        return outil;
    }

    private Outil nouveau(ContexteOutil contexte, OutilSaisie saisie) {
        if (saisie.typeOutil() == null) {
            throw new IllegalArgumentException("Le type d'outil est obligatoire");
        }
        Outil outil = new Outil();
        outil.setTypeOutil(saisie.typeOutil());
        outil.setAuteur(contexte.utilisateur());
        outil.setDateCreation(LocalDateTime.now());
        return outil;
    }

    /**
     * Partage avec tous : plus d'espace. Retour dans un espace : celui d'origine
     * s'il en avait un, sinon l'espace ouvert. Un administrateur d'espace ne
     * partage pas l'outil d'un autre avec toute l'application.
     */
    private void appliquerPortee(Outil outil, PorteeOutil demandee, ContexteOutil contexte) {
        PorteeOutil portee = demandee == null ? PorteeOutil.ESPACE : demandee;
        if (outil.getId() != null && portee != outil.getPortee() && !estAuteurOuAdminSysteme(outil, contexte)) {
            throw new IllegalArgumentException("Seul son auteur peut changer le partage de cet outil");
        }
        if (portee == PorteeOutil.TOUS_LES_ESPACES) {
            outil.setProject(null);
        } else if (outil.getProject() == null) {
            outil.setProject(contexte.espace());
        }
        outil.setPortee(portee);
    }

    private boolean estAuteurOuAdminSysteme(Outil outil, ContexteOutil contexte) {
        return contexte.adminSysteme()
                || (outil.getAuteur() != null && outil.getAuteur().getId().equals(contexte.utilisateur().getId()));
    }
}
