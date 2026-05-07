package com.kinga.followtask.repository;

import com.kinga.followtask.entity.converter.IssueDocumentUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssueDocumentUsageRepository extends JpaRepository<IssueDocumentUsage,Long> {
    List<IssueDocumentUsage> findByIssueIdAndDocumentId(Long issueId,Long documentId);

    List<IssueDocumentUsage> findByDocumentId(Long documentId);
}
