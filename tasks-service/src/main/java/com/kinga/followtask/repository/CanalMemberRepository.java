package com.kinga.followtask.repository;

import com.kinga.followtask.entity.ActionItem;
import com.kinga.followtask.entity.CanalMember;
import com.kinga.followtask.entity.Canall;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CanalMemberRepository extends JpaRepository<CanalMember,Long> {
    List<CanalMember> findByUserIdIn(Collection<String> userIds);
    Optional<CanalMember> findByCanallAndExternalMemberId(Canall canall, String externalUserId);
}
