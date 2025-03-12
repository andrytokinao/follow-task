package com.kinga.followtask.repository;

import com.kinga.followtask.entity.ActionItem;
import com.kinga.followtask.entity.Canall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CanalRepository extends JpaRepository<Canall, Long> {
    public List<Canall> findByProjectsIdAndMembersUserIdIn(Long projectsIds, List<String> membersIds);

        @Query("""
        SELECT c FROM Canall c 
        WHERE c.id IN (
            SELECT cm.canall.id FROM CanalMember cm
            WHERE cm.user.id IN :userIds
            GROUP BY cm.canall.id
            HAVING COUNT(DISTINCT cm.user.id) = :size
        )
        AND SIZE(c.members) = :size 
        AND c.projects.id = :projectsIds
    """)
    List<Canall> exactChannelByMembers(@Param("projectsIds") Long projectsIds,  @Param("userIds") List<String> userIds, @Param("size") long size);

}
