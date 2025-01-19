package com.kinga.followtask.repository;

import com.kinga.followtask.entity.ActionItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<ActionItem,Long> {
}
