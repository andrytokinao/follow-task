package com.kinga.followtask.repository;

import com.kinga.followtask.entity.CustomField;
import com.kinga.followtask.entity.IssueFilter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomIssueFilterRepository extends JpaRepository<IssueFilter,Long> {
    public List<IssueFilter> findByProjectIdAndUserId(Long projectId,String userId);
}
