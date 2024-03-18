package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.IssueType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IssueTypeRepository extends JpaRepository<IssueType,Long> {
}
