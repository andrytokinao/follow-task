package com.kinga.followtask.repository;

import com.kinga.followtask.entity.PlanningEventExecution;
import jdk.jshell.spi.ExecutionControl;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanningExecutionRepository extends JpaRepository<PlanningEventExecution,Long> {
}
