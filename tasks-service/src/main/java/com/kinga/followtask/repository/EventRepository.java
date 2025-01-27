package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Event;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.UserApp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event,Long> {
    @Query("SELECT e FROM Event e " +
            "WHERE (:userIds IS NULL OR e.user.id IN :userIds) " +
            "AND (:issueIds IS NULL OR e.issue.id IN :issueIds) " +
            "AND (:start IS NULL OR e.start >= :start) " +
            "AND (:end IS NULL OR e.end <= :end) "+
            "AND (:projectId IS NULL OR e.project.id = :projectId) ")
    List<Event> findEventsByUserIdsAndIssues(@Param("userIds") List<String> userIds,
                                             @Param("issueIds") List<Long> issueIds,
                                             @Param("start") LocalDateTime start,
                                             @Param("end") LocalDateTime end,
                                             @Param("projectId") Long projectId
    );

    @Query("SELECT e FROM Event e " +
            "WHERE (:userIds IS NULL OR e.user.id IN :userIds) " +
            "AND (:start IS NULL OR e.start >= :start) " +
            "AND (:end IS NULL OR e.end <= :end) " +
            "AND ( (:parrentIds IS NULL OR e.issue.parent.id IN :parrentIds ) OR (:issueIds IS NULL OR e.issue.id IN :issueIds) )" +
            "AND (:projectId IS NULL OR e.project.id = :projectId) ")
    List<Event> findEventsByUserIdsAndIssuesAndParent(@Param("userIds") List<String> userIds,
                                             @Param("issueIds") List<Long> issueIds,
                                             @Param("parrentIds") List<Long> parrentIds,
                                             @Param("start") LocalDateTime start,
                                             @Param("end") LocalDateTime end,
                                              @Param("projectId") Long projectId

    );

    public Event findByDateValueId(Long valueId);
}
