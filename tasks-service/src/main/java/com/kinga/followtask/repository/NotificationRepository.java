package com.kinga.followtask.repository;

import com.kinga.followtask.entity.ActionItem;
import com.kinga.followtask.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.graphql.data.method.annotation.QueryMapping;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification,Long> {
    @Query(value = "SELECT * FROM Notification WHERE userIds LIKE %?1%", nativeQuery = true)
    List<Notification> findByUserId(String userId);
}
