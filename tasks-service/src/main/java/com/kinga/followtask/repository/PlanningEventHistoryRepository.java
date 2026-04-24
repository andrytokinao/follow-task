package com.kinga.followtask.repository;

import com.kinga.followtask.entity.PlanningEventHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanningEventHistoryRepository extends JpaRepository<PlanningEventHistory,Long> {
}
