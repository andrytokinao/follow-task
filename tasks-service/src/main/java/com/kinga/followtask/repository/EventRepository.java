package com.kinga.followtask.repository;

import com.kinga.followtask.entity.PlanningEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface EventRepository extends JpaRepository<PlanningEvent,Long> {
    @Query("SELECT e FROM PlanningEvent e " +
            "WHERE (:userIds IS NULL OR e.user.id IN :userIds) " +
            "AND (:issueIds IS NULL OR e.issue.id IN :issueIds) " +
            "AND (:start IS NULL OR e.start >= :start) " +
            "AND (:end IS NULL OR e.end <= :end) "+
            "AND (:projectId IS NULL OR e.project.id = :projectId) ")
    List<PlanningEvent> findEventsByUserIdsAndIssues(@Param("userIds") List<String> userIds,
                                                     @Param("issueIds") List<Long> issueIds,
                                                     @Param("start") LocalDateTime start,
                                                     @Param("end") LocalDateTime end,
                                                     @Param("projectId") Long projectId
    );

    @Query("SELECT e FROM PlanningEvent e " +
            "WHERE (:userIds IS NULL OR e.user.id IN :userIds) " +
            "AND (:start IS NULL OR e.start >= :start) " +
            "AND (:end IS NULL OR e.end <= :end) " +
            "AND ( (:parrentIds IS NULL OR e.issue.parent.id IN :parrentIds ) OR (:issueIds IS NULL OR e.issue.id IN :issueIds) )" +
            "AND (:projectId IS NULL OR e.project.id = :projectId) ")
    List<PlanningEvent> findEventsByUserIdsAndIssuesAndParent(@Param("userIds") List<String> userIds,
                                                              @Param("issueIds") List<Long> issueIds,
                                                              @Param("parrentIds") List<Long> parrentIds,
                                                              @Param("start") LocalDateTime start,
                                                              @Param("end") LocalDateTime end,
                                                              @Param("projectId") Long projectId

    );

    public PlanningEvent findByDateValueId(Long valueId);

    /** Activites d'une personne qui touchent la periode [debut, fin[ ; une fin absente ne borne rien. */
    @Query("SELECT e FROM PlanningEvent e " +
            "WHERE e.user.id = :userId " +
            "AND e.start < :fin " +
            "AND (e.end IS NULL OR e.end > :debut)")
    List<PlanningEvent> findByUserIdChevauchant(@Param("userId") String userId,
                                                @Param("debut") LocalDateTime debut,
                                                @Param("fin") LocalDateTime fin);

    /** Meme recherche pour plusieurs personnes a la fois : une requete pour toute l'equipe. */
    @Query("SELECT e FROM PlanningEvent e " +
            "WHERE e.user.id IN :userIds " +
            "AND e.start < :fin " +
            "AND (e.end IS NULL OR e.end > :debut)")
    List<PlanningEvent> findByUserIdInChevauchant(@Param("userIds") Collection<String> userIds,
                                                  @Param("debut") LocalDateTime debut,
                                                  @Param("fin") LocalDateTime fin);

    /**
     * Seances de ces demandes ou de leurs sous-taches qui chevauchent la periode,
     * fin vide comprise. Jointure externe sur le parent : une seance posee sur
     * le projet lui-meme (sans parent) compte aussi.
     */
    @Query("SELECT e FROM PlanningEvent e JOIN e.issue i LEFT JOIN i.parent p " +
            "WHERE (i.id IN :issueIds OR p.id IN :issueIds) " +
            "AND e.start < :fin " +
            "AND (e.end IS NULL OR e.end > :debut)")
    List<PlanningEvent> findByIssueOuParentChevauchant(@Param("issueIds") Collection<Long> issueIds,
                                                       @Param("debut") LocalDateTime debut,
                                                       @Param("fin") LocalDateTime fin);
}
