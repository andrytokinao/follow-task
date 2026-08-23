package com.kinga.followtask.service;

import com.kinga.followtask.entity.enumapp.IssueRole;
import com.kinga.followtask.repository.IssueMembershipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor

public class IssueAccessService {

    private final IssueMembershipRepository membershipRepository;

    public boolean canView(Long issueId, String userId) {
        return membershipRepository
                .findByIssueIdAndUserIdAndUnassignedAtIsNull(issueId, userId)
                .isPresent();
    }

    public boolean canEdit(Long issueId, String userId) {
        return membershipRepository
                .findByIssueIdAndUserIdAndUnassignedAtIsNull(issueId, userId)
                .map(m -> m.getRole().atLeast(IssueRole.ASSIGNEE))
                .orElse(false);
    }

    public boolean canManageMembers(Long issueId, String userId) {
        return membershipRepository
                .findByIssueIdAndUserIdAndUnassignedAtIsNull(issueId, userId)
                .map(m -> m.getRole().atLeast(IssueRole.ADMIN))
                .orElse(false);
    }
}