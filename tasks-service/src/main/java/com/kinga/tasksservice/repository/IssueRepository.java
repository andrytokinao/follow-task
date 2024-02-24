package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IssueRepository extends JpaRepository<Issue,Long> {
}
