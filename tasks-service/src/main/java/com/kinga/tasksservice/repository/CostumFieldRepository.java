package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.CustomField;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CostumFieldRepository extends JpaRepository<CustomField,Long> {
}
