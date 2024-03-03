package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.WorkFlow;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkFlowRepository extends JpaRepository<WorkFlow,Long> {
}
