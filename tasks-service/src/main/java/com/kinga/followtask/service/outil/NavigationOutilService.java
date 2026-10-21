package com.kinga.followtask.service.outil;

import com.kinga.followtask.dto.outil.ContenuDossierOutil;
import com.kinga.followtask.dto.outil.DossierOutilVue;
import com.kinga.followtask.dto.outil.OutilVue;
import com.kinga.followtask.entity.DossierOutil;
import com.kinga.followtask.entity.FichierOutil;
import com.kinga.followtask.entity.Outil;
import com.kinga.followtask.entity.enumapp.TypeOutil;
import com.kinga.followtask.repository.DossierOutilRepository;
import com.kinga.followtask.repository.FichierOutilRepository;
import com.kinga.followtask.repository.OutilRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Lecture du menu Outils (DT-019) : contenu d'un dossier, recherche a plat
 * et fiche d'un outil, toujours depuis l'espace ouvert.
 */
@Service
@RequiredArgsConstructor
public class NavigationOutilService {

    /** En dessous, la recherche renverrait presque tout. */
    static final int RECHERCHE_MIN = 2;

    private final DossierOutilRepository dossierRepository;
    private final OutilRepository outilRepository;
    private final FichierOutilRepository fichierRepository;
    private final DossierOutilService dossierService;
    private final OutilService outilService;
    private final RangementOutil rangement;
    private final VuesOutil vues;

    /** Contenu d'un dossier ; dossierId null : racine du type. */
    @Transactional(readOnly = true)
    public ContenuDossierOutil contenu(ContexteOutil contexte, TypeOutil type, Long dossierId) {
        if (type == null) {
            throw new IllegalArgumentException("Le type d'outil est obligatoire");
        }
        Long espaceId = contexte.espace().getId();
        DossierOutil dossier = dossierId == null ? null : dossierService.visible(contexte, dossierId);
        if (dossier != null && dossier.getTypeOutil() != type) {
            throw new IllegalArgumentException("Le dossier « " + dossier.getNom() + " » n'est pas de ce type");
        }
        List<DossierOutilVue> sousDossiers = dossierRepository.sousDossiersVisibles(espaceId, type, dossierId).stream()
                .map(d -> vues.dossier(d, contexte))
                .toList();
        List<Outil> outils = dossier == null
                ? outilRepository.visiblesALaRacine(espaceId, type)
                : outilRepository.visiblesDansDossier(espaceId, type, dossierId);
        List<DossierOutilVue> chemin = dossier == null ? List.of()
                : vues.ascendance(dossier).stream().map(d -> vues.dossier(d, contexte)).toList();
        boolean peutCreerDossier = dossier == null || rangement.profondeur(dossier) < RangementOutil.PROFONDEUR_MAX;
        return new ContenuDossierOutil(type,
                dossier == null ? null : vues.dossier(dossier, contexte),
                chemin, sousDossiers, vuesOutils(outils, contexte), peutCreerDossier);
    }

    /** Recherche a plat dans tous les types et dossiers visibles. */
    @Transactional(readOnly = true)
    public List<OutilVue> rechercher(ContexteOutil contexte, String texte) {
        String cherche = texte == null ? "" : texte.trim();
        if (cherche.length() < RECHERCHE_MIN) {
            return List.of();
        }
        return vuesOutils(outilRepository.rechercher(contexte.espace().getId(), cherche), contexte);
    }

    @Transactional(readOnly = true)
    public OutilVue fiche(ContexteOutil contexte, Long outilId) {
        return vuesOutils(List.of(outilService.visible(contexte, outilId)), contexte).get(0);
    }

    /** Fichiers de tous les outils en une requete. */
    private List<OutilVue> vuesOutils(List<Outil> outils, ContexteOutil contexte) {
        if (outils.isEmpty()) {
            return List.of();
        }
        Set<Long> dossiersVisibles = dossierRepository.visibles(contexte.espace().getId()).stream()
                .map(DossierOutil::getId)
                .collect(Collectors.toSet());
        Map<Long, List<FichierOutil>> fichiers = fichierRepository
                .findByOutilIdInAndDeletedFalseOrderByDateAjoutAsc(outils.stream().map(Outil::getId).toList()).stream()
                .collect(Collectors.groupingBy(f -> f.getOutil().getId()));
        return outils.stream()
                .map(o -> vues.outil(o, fichiers.getOrDefault(o.getId(), List.of()), dossiersVisibles, contexte))
                .toList();
    }
}
