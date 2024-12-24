package com.kinga.followtask.repository;

import com.kinga.followtask.entity.WorkFlow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkFlowRepository extends JpaRepository<WorkFlow,Long> {
    public List<WorkFlow> findByProjectId(Long projectId);
    public WorkFlow findWorkFlowByName(String name);
}
