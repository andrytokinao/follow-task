package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.Issue;
import com.kinga.tasksservice.entity.Value;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssueRepository extends JpaRepository<Issue,Long> {
    public List<Issue> findByAssigneId(String id);
}
