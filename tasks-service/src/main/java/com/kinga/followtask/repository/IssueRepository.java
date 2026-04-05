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

}
