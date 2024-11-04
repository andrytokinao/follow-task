package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IssueRepository extends JpaRepository<Issue,Long> {
    public List<Issue> findByAssigneId(String id);
    public Optional<Issue> findTopByIssueTypeIdOrderByIssueKeyDesc(Long issueTypeId);
    @Query("SELECT MAX(CAST(SUBSTRING(i.issueKey, LENGTH(:prefix) + 1) AS int)) FROM Issue i WHERE i.issueKey LIKE CONCAT(:prefix, '%')")
    Integer findMaxProjectNumberWithPrefix(@Param("prefix") String prefix);

    public List<Issue> findByIssueTypeIdIn(List<Long> issueT);
    public Issue findByIssueKey(String issueKey);
    public List<Issue> findByParentId(Long parentId);

}
