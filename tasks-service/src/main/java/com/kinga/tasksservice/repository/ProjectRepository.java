package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project,Long> {
    public List<Project> findByPrefix(String prefix);
}
