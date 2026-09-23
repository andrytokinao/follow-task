package com.kinga.followtask.service;

import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.Status;
import com.kinga.followtask.entity.Uploaded;
import com.kinga.followtask.entity.WorkFlow;
import com.kinga.followtask.entity.enumapp.Niveau;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.IssueTypeRepository;
import com.kinga.followtask.repository.UploadedRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

/**
 * Point unique du changement de type d'une tache.
 *
 * <p>Deux chemins y menent : le bouton « changer le type » d'une tache et la
 * suppression d'un type, qui rattache d'abord les taches concernees. Les deux
 * passent par {@link #applyIssueType(Issue, IssueType, boolean)} pour que la
 * regle (type autorise, statut, cle, dossier) reste ecrite une seule fois.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IssueTypeChangeService {

    private final IssueRepository issueRepository;
    private final IssueTypeRepository issueTypeRepository;
    private final UploadedRepository uploadedRepository;
    private final IssueKeyService issueKeyService;

    // -----------------------------------------------------------------
    // Lecture : ce que le formulaire propose
    // -----------------------------------------------------------------

    /**
     * Types qu'une tache peut recevoir.
     *
     * <p>Une tache principale ne prend qu'un type principal du meme projet ;
     * une sous-tache ne prend qu'un des sous-types declares sous le type de sa
     * tache parente. Le type actuel fait partie de la liste : le formulaire
     * doit pouvoir montrer la selection courante.</p>
     */
    public List<IssueType> changeableIssueTypes(Long issueId) {
        Issue issue = chargerIssue(issueId);
        List<IssueType> candidats = new ArrayList<>(typesAutorises(issue));
        candidats.sort(Comparator.comparing(type -> type.getName() == null ? "" : type.getName()));
        return candidats;
    }

    // -----------------------------------------------------------------
    // Ecriture
    // -----------------------------------------------------------------

    /**
     * Change le type d'une tache depuis le formulaire dedie : le type demande
     * doit faire partie de ceux que {@link #changeableIssueTypes(Long)} propose.
     */
    @Transactional
    public Issue changeIssueType(Long issueId, Long issueTypeId, Boolean renameKey) {
        Issue issue = chargerIssue(issueId);
        IssueType target = chargerType(issueTypeId);
        boolean autorise = typesAutorises(issue).stream()
                .anyMatch(type -> Objects.equals(type.getId(), target.getId()));
        if (!autorise) {
            throw new RuntimeException("Le type " + target.getName()
                    + " n'est pas proposable pour la tache " + issue.getIssueKey());
        }
        return applyIssueType(issue, target, Boolean.TRUE.equals(renameKey));
    }

    /**
     * Applique un type a une tache deja chargee et validee par l'appelant :
     * statut ramene au flux du nouveau type, cle et dossier renommes si demande.
     *
     * <p>La tache est enregistree avant le retour : la cle suivante d'un type
     * tient donc compte des taches qui viennent de le recevoir.</p>
     */
    @Transactional
    public Issue applyIssueType(Issue issue, IssueType target, boolean renameKey) {
        issue.setIssueType(target);
        alignerStatut(issue, target);
        if (renameKey) {
            Project project = issue.getProject() != null ? issue.getProject() : target.getProject();
            String ancienneCle = issue.getIssueKey();
            String nouvelleCle = issueKeyService.nextKey(target, project);
            issue.setIssueKey(nouvelleCle);
            if (!Objects.equals(ancienneCle, nouvelleCle)) {
                renameIssueDirectory(issue, nouvelleCle);
            }
        }
        issue.setUpdateDate(LocalDateTime.now());
        return issueRepository.saveAndFlush(issue);
    }

    // -----------------------------------------------------------------
    // Regles internes
    // -----------------------------------------------------------------

    private Issue chargerIssue(Long issueId) {
        if (issueId == null)
            throw new RuntimeException("La tache est obligatoire");
        return issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Tache introuvable : " + issueId));
    }

    private IssueType chargerType(Long issueTypeId) {
        if (issueTypeId == null)
            throw new RuntimeException("Le nouveau type est obligatoire");
        return issueTypeRepository.findById(issueTypeId)
                .orElseThrow(() -> new RuntimeException("Type de tache introuvable : " + issueTypeId));
    }

    /**
     * Types admissibles pour une tache : les types principaux du projet pour une
     * tache racine, les sous-types du type de la tache parente pour une sous-tache.
     */
    private List<IssueType> typesAutorises(Issue issue) {
        Issue parent = issue.getParent();
        if (parent == null) {
            Long projectId = projectId(issue);
            if (projectId == null)
                return List.of();
            return issueTypeRepository.findByProjectIdAndLevel(projectId, Niveau.PARENT);
        }
        // Le parent vient d'une relation lazy : relire garantit son type.
        Issue parentCharge = issueRepository.findById(parent.getId())
                .orElseThrow(() -> new RuntimeException("Tache parente introuvable : " + parent.getId()));
        if (parentCharge.getIssueType() == null)
            return List.of();
        return issueTypeRepository.findByParents_Id(parentCharge.getIssueType().getId());
    }

    private Long projectId(Issue issue) {
        if (issue.getProject() != null)
            return issue.getProject().getId();
        if (issue.getIssueType() != null && issue.getIssueType().getProject() != null)
            return issue.getIssueType().getProject().getId();
        return null;
    }

    /**
     * Retient, parmi les statuts du flux de travail du type, celui que porte la
     * tache ; a defaut le statut initial du flux.
     *
     * <p>Sert au changement de type comme a la creation : une tache creee
     * depuis une colonne de board porte le statut de cette colonne, qui peut
     * appartenir au flux d'un autre type que celui finalement choisi.</p>
     *
     * <p>Le statut retenu est toujours celui du flux, jamais l'objet recu du
     * client : celui-ci n'arrive qu'avec son identifiant.</p>
     */
    public void alignerStatut(Issue issue, IssueType target) {
        WorkFlow workFlow = target.getCurentWorkFlow();
        if (workFlow == null || CollectionUtils.isEmpty(workFlow.getStatuses()))
            return;
        Status demande = issue.getStatus();
        Status retenu = demande == null || demande.getId() == null ? null
                : workFlow.getStatuses().stream()
                .filter(status -> demande.getId().equals(status.getId()))
                .findFirst()
                .orElse(null);
        issue.setStatus(retenu != null ? retenu : workFlow.getStatuses().get(0));
    }

    // -----------------------------------------------------------------
    // Dossier de la tache
    // -----------------------------------------------------------------

    /**
     * Renomme le dossier de la tache pour suivre sa nouvelle cle
     * (.../TACHE-03 devient .../DATA-102) et reporte le nouveau chemin sur la
     * tache, ses descendantes et les fichiers deja traces.
     *
     * <p>Confort, pas obligation : un dossier absent, verrouille ou deja pris
     * laisse le changement de cle aboutir, avec une trace dans les logs.</p>
     */
    private void renameIssueDirectory(Issue issue, String nouvelleCle) {
        String ancienChemin = issue.getDirectory();
        if (!StringUtils.hasText(ancienChemin))
            return;
        try {
            Path ancien = Paths.get(ancienChemin).toAbsolutePath().normalize();
            if (!Files.isDirectory(ancien)) {
                log.info("Dossier {} introuvable : la cle {} change sans renommage", ancien, nouvelleCle);
                return;
            }
            Path nouveau = ancien.resolveSibling(nouvelleCle);
            if (Files.exists(nouveau)) {
                log.warn("Dossier {} deja present : la cle {} change sans renommage", nouveau, nouvelleCle);
                return;
            }
            Files.move(ancien, nouveau);
            reporterChemin(issue, ancien.toString(), nouveau.toString());
        } catch (IOException | RuntimeException e) {
            log.warn("Renommage du dossier de {} vers {} impossible : {}",
                    ancienChemin, nouvelleCle, e.getMessage());
        }
    }

    /**
     * Reporte le deplacement du dossier sur la tache, ses descendantes (leurs
     * dossiers sont imbriques dans celui du parent) et les fichiers traces.
     */
    private void reporterChemin(Issue issue, String ancien, String nouveau) {
        issue.setDirectory(nouveau);
        // Le separateur evite de confondre .../TACHE-3 et son voisin .../TACHE-30.
        String ancienPrefixe = ancien + File.separator;
        String nouveauPrefixe = nouveau + File.separator;
        reporterCheminDescendants(issue.getId(), ancienPrefixe, nouveauPrefixe);
        for (Uploaded uploaded : uploadedRepository.findByPathStartingWith(ancienPrefixe)) {
            uploaded.setPath(nouveauPrefixe + uploaded.getPath().substring(ancienPrefixe.length()));
            uploadedRepository.save(uploaded);
        }
    }

    private void reporterCheminDescendants(Long issueId, String ancienPrefixe, String nouveauPrefixe) {
        for (Issue enfant : issueRepository.findByParentId(issueId)) {
            String chemin = enfant.getDirectory();
            if (StringUtils.hasText(chemin) && chemin.startsWith(ancienPrefixe)) {
                enfant.setDirectory(nouveauPrefixe + chemin.substring(ancienPrefixe.length()));
                issueRepository.save(enfant);
            }
            reporterCheminDescendants(enfant.getId(), ancienPrefixe, nouveauPrefixe);
        }
    }
}
