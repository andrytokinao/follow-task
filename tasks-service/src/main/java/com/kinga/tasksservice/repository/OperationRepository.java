package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.Operation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationRepository extends JpaRepository<Operation,Long> {
}
