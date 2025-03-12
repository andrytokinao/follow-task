package com.kinga.followtask.repository;

import com.kinga.followtask.entity.ActionItem;
import com.kinga.followtask.entity.CanalMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CanalMemberRepository extends JpaRepository<CanalMember,Long> {
    List<CanalMember> findByUserIdIn(Collection<String> userIds);
}
