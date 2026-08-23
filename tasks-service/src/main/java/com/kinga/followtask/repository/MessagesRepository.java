package com.kinga.followtask.repository;

import com.kinga.followtask.entity.ActionItem;
import com.kinga.followtask.entity.MessageApp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessagesRepository extends JpaRepository<MessageApp,Long> {
    boolean existsByExternalMessageId(String externalMessageId);
    @Query("""
        SELECT DISTINCT m FROM MessageApp m
        WHERE (m.mediaType IS NULL OR m.mediaType <> 'SYSTEM')
          AND (
            m.id IN (
                SELECT l.message.id FROM IssueMessageLink l WHERE l.issue.id = :issueId
            )
            OR m.canall.id IN (
                SELECT cl.canal.id FROM IssueCanalLink cl
                WHERE cl.issue.id = :issueId
                  AND cl.endedAt IS NULL
                  AND m.created >= cl.since
            )
          )
        ORDER BY m.created ASC
        """)
    List<MessageApp> findVisibleMessagesForIssue(@Param("issueId") Long issueId);
    Optional<MessageApp> findByExternalMessageId(String externalMessageId);


}
