package com.kinga.followtask.service;

import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.IssueTypeRepository;
import com.kinga.followtask.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Seul calcul de cle de tache de l'application.
 *
 * <p>Creation d'une tache, apercu affiche par les formulaires et changement de
 * type appellent tous {@link #nextKey(IssueType, Project)} : une cle proposee
 * est donc exactement celle qui sera enregistree.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IssueKeyService {

    private final IssueRepository issueRepository;
    private final IssueTypeRepository issueTypeRepository;
    private final ProjectRepository projectRepository;

    /**
     * Cle suivante du type dans le projet : son prefixe suivi du premier numero
     * libre, en sautant une cle deja portee par une autre tache du projet (deux
     * types peuvent partager un prefixe, rien ne l'interdit).
     */
    public String nextKey(IssueType issueType, Project project) {
        if (issueType == null)
            return "";
        String prefix = issueType.getPrefix() + "-";
        Integer max = project != null
                ? issueRepository.findMaxProjectNumberWithPrefixAndProject(prefix, issueType.getId(), project.getId())
                : issueRepository.findMaxProjectNumberWithPrefix(prefix, issueType.getId());
        int numero = max == null ? 1 : max + 1;
        String key = prefix + numero;
        while (project != null && project.getPrefix() != null
                && issueRepository.findFirstByIssueKeyAndProjectPrefix(key, project.getPrefix()).isPresent()) {
            key = prefix + (++numero);
        }
        return key;
    }

    /**
     * Meme calcul a partir des identifiants, pour les appels GraphQL. Chaine
     * vide si le type est inconnu : le formulaire affiche alors un champ vide
     * plutot qu'une erreur.
     */
    public String nextKey(Long issueTypeId, Long projectId) {
        if (issueTypeId == null)
            return "";
        IssueType issueType = issueTypeRepository.findById(issueTypeId).orElse(null);
        if (issueType == null)
            return "";
        Project project = projectId == null ? issueType.getProject()
                : projectRepository.findById(projectId).orElse(issueType.getProject());
        return nextKey(issueType, project);
    }
}
