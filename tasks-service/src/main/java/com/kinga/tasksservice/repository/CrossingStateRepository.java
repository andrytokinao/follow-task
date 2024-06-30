package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.CrossingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CrossingStateRepository extends JpaRepository<CrossingStatus,Long> {
}
