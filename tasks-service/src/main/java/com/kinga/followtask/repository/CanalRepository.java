package com.kinga.followtask.repository;

import com.kinga.followtask.entity.ActionItem;
import com.kinga.followtask.entity.Canall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CanalRepository extends JpaRepository<Canall, Long> {
    public List<Canall> findByProjectsIdAndMembersUserIdIn(Long projectsIds, List<String> membersIds);

        @Query("""
        SELECT c FROM CanalMember cm
        JOIN cm.user u
        JOIN cm.canall c
        WHERE u.id IN (:userIds)
        AND c.projects.id = :projectsId
        GROUP BY c
        HAVING COUNT(u.id) = :userCount
    """)
    List<Canall> exactChannelByMembers(@Param("projectsId") Long projectsId,  @Param("userIds") List<String> userIds, @Param("userCount") long userCount);
    Optional<Canall> findByExternalId(String externalId);
}
