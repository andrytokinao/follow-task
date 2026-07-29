package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Canall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CanalRepository extends JpaRepository<Canall, Long> {

    List<Canall> findByProjectsIdAndMembersContactUserAppIdIn(Long projectsId, List<String> userIds);

    @Query("""
        SELECT c FROM CanalContact cc
        JOIN cc.contact ct
        JOIN cc.canall c
        WHERE ct.userApp.id IN (:userIds)
        AND c.projects.id = :projectsId
        GROUP BY c
        HAVING COUNT(ct.userApp.id) = :userCount
    """)
    List<Canall> exactChannelByMembers(
            @Param("projectsId") Long projectsId,
            @Param("userIds") List<String> userIds,
            @Param("userCount") long userCount
    );

    Optional<Canall> findByExternalId(String externalId);
}