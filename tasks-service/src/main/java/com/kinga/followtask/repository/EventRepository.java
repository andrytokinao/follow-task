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
            "AND (:end IS NULL OR e.end <= :end) ")
    List<Event> findEventsByUserIdsAndIssues(@Param("userIds") List<String> userIds,
                                             @Param("issueIds") List<Long> issueIds,
                                             @Param("start") LocalDateTime start,
                                             @Param("end") LocalDateTime end);

    @Query("SELECT e FROM Event e " +
            "WHERE (:userIds IS NULL OR e.user.id IN :userIds) " +
            "AND (:issueIds IS NULL OR e.issue.id IN :issueIds) " +
            "AND (:start IS NULL OR e.start >= :start) " +
            "AND (:end IS NULL OR e.end <= :end) " +
            "AND (:parrentIds IS NULL OR e.issue.parent.id IN :parrentIds )")
    List<Event> findEventsByUserIdsAndIssues2(@Param("userIds") List<String> userIds,
                                             @Param("issueIds") List<Long> issueIds,
                                             @Param("parrentIds") List<Long> parrentIds,
                                             @Param("start") LocalDateTime start,
                                             @Param("end") LocalDateTime end);


}
