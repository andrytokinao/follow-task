package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.WorkFlow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkFlowRepository extends JpaRepository<WorkFlow,Long> {
    public List<WorkFlow> findByProjectId(Long projectId);
}
