package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.Project;
import com.kinga.tasksservice.entity.State;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StateRepository extends JpaRepository<State,Long> {
}
