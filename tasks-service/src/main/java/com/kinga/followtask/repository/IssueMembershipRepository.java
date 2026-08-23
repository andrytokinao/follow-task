package com.kinga.followtask.repository;

import com.kinga.followtask.entity.IssueMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface IssueMembershipRepository extends JpaRepository<IssueMembership, Long> {
    Optional<IssueMembership> findByIssueIdAndUserIdAndUnassignedAtIsNull(Long issueId, String userId);
    List<IssueMembership> findByIssueIdAndUnassignedAtIsNull(Long issueId);
    List<IssueMembership> findByUserIdAndUnassignedAtIsNull(String userId);
}