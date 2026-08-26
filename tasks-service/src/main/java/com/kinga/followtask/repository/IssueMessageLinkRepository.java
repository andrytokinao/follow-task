package com.kinga.followtask.repository;

import com.kinga.followtask.entity.IssueMessageLink;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface IssueMessageLinkRepository extends JpaRepository<IssueMessageLink, Long> {
    boolean existsByIssueIdAndMessageId(Long issueId, Long messageId);
    List<IssueMessageLink> findByIssueId(Long issueId);

    Optional<IssueMessageLink> findByIssueIdAndMessageId(Long issueId, Long id);
}