package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.CostumField;
import com.kinga.tasksservice.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CostumFieldRepository extends JpaRepository<CostumField,Long> {
}
