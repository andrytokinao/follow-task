package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.repository.criteria.IssueSpecification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IssueRepository extends JpaRepository<Issue,Long>, JpaSpecificationExecutor<Issue> {
    public List<Issue> findByAssigneId(String id);
    public Optional<Issue> findTopByIssueTypeIdOrderByIssueKeyDesc(Long issueTypeId);
    @Query("SELECT MAX(CAST(SUBSTRING(i.issueKey, LENGTH(:prefix) + 1) AS int)) FROM Issue i WHERE i.issueKey LIKE CONCAT(:prefix, '%') AND i.issueType.id = :issueType")
    Integer findMaxProjectNumberWithPrefix(@Param("prefix") String prefix, @Param("issueType") Long issueType );
    @Query("SELECT MAX(CAST(SUBSTRING(i.issueKey, LENGTH(:prefix) + 1) AS int)) FROM Issue i WHERE i.issueKey LIKE CONCAT(:prefix, '%') AND i.issueType.id = :issueType AND i.project.id = :projectId")
    Integer findMaxProjectNumberWithPrefixAndProject(@Param("prefix") String prefix, @Param("issueType") Long issueType, @Param("projectId") Long projectId);

    public List<Issue> findByIssueTypeIdIn(List<Long> issueT);
    public Issue findByIssueKey(String issueKey);
    public List<Issue> findByParentId(Long parentId);
    public List<Issue> findByIssueTypeProjectPrefix(String prefix);
    public List<Issue> findByIssueTypeIn(List<IssueType> issueTypes);

    /**
     * Demandes d'un espace de travail actuellement assignées à l'une des
     * personnes données.
     *
     * L'assignation est lue sur les adhésions ouvertes ({@code unassignedAt}
     * nul), qui sont la notion d'assignation du modèle ; le champ historique
     * {@code assigne} n'est plus alimenté. Utilisée par le rapport par
     * personne, où une tâche assignée mais jamais commencée doit figurer :
     * c'est précisément ce qu'un rapport d'activité doit montrer.
     */
    @Query("SELECT DISTINCT i FROM Issue i JOIN i.memberships m " +
            "WHERE i.project.id = :projectId " +
            "AND m.unassignedAt IS NULL " +
            "AND m.user.id IN :userIds")
    List<Issue> findAssigneesDansProjet(@Param("projectId") Long projectId,
                                        @Param("userIds") List<String> userIds);

    /**
     * Demandes racines d'un espace de travail, c'est-à-dire les « projets » au
     * sens du rapport.
     *
     * <p>Une racine est ici une demande sans parent. C'est plus strict que la
     * règle de {@code RapportService.chargerIssueRacine}, qui accepte aussi une
     * demande intermédiaire portant des enfants : on propose au choix ce qu'un
     * utilisateur appelle un projet, pas tout ce dont un rapport pourrait être
     * tiré.</p>
     *
     * <p>Les plus récentes d'abord : c'est sur celles-là que porte un rapport
     * dans l'immense majorité des cas.</p>
     */
    @Query("SELECT i FROM Issue i WHERE i.project.id = :projectId AND i.parent IS NULL " +
            "ORDER BY i.creationDate DESC NULLS LAST, i.id DESC")
    List<Issue> findRacinesDuProjet(@Param("projectId") Long projectId);
}
