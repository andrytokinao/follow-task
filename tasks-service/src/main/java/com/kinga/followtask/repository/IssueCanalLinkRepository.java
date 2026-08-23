package com.kinga.followtask.repository;

import com.kinga.followtask.entity.IssueCanalLink;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface IssueCanalLinkRepository extends JpaRepository<IssueCanalLink, Long> {
    List<IssueCanalLink> findByCanalIdAndEndedAtIsNull(Long canalId);
    List<IssueCanalLink> findByIssueIdAndEndedAtIsNull(Long issueId);
    Optional<IssueCanalLink> findByIssueIdAndCanalIdAndEndedAtIsNull(Long issueId, Long canalId);
}