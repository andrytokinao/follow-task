package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.Value;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ValueRepository extends JpaRepository<Value,Long> {
}
