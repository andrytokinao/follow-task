package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.Issue;
import com.kinga.tasksservice.entity.PasseTime;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasseTimeRepository extends JpaRepository<PasseTime,Long> {
}
