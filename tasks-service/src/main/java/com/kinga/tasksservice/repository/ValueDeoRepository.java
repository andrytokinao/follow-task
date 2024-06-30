package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.CustomFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ValueDeoRepository extends JpaRepository<CustomFieldValue,Long> {
    public List<CustomFieldValue> findCustomFieldValueByIssueId(Long id);
}
