package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.CrossingState;
import com.kinga.tasksservice.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CrossingStateRepository extends JpaRepository<CrossingState,Long> {
}
