package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StateRepository extends JpaRepository<Status,Long> {
}
