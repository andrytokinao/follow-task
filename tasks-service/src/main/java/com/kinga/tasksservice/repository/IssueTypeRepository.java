package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.IssueType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssueTypeRepository extends JpaRepository<IssueType,Long> {
    List<IssueType> findByProjectId(Long projectId);
}
