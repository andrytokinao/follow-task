package com.kinga.followtask.repository;

import com.kinga.followtask.entity.CustomField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomFieldRepository extends JpaRepository<CustomField,Long> {
    public List<CustomField> findByProjectId(Long projectId);
}
