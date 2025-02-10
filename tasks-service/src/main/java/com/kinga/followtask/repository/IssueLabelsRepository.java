package com.kinga.followtask.repository;

import com.kinga.followtask.entity.IssueLabels;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssueLabelsRepository extends JpaRepository<IssueLabels,Long> {
    public List<IssueLabels> findByIssueIdAndLabelId(Long issueId,Long labelId);
    public List<IssueLabels> findByIssueId(Long issueId);
}
