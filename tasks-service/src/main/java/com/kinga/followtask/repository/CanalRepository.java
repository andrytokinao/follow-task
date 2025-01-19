package com.kinga.followtask.repository;

import com.kinga.followtask.entity.ActionItem;
import com.kinga.followtask.entity.Canall;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CanalRepository extends JpaRepository<Canall,Long> {
}
