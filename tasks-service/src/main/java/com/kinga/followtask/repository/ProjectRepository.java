package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project,Long> {
    public Project findByPrefix(String prefix);
    public List<Project> findByPrefixIn(List<String> prefixes);
}
