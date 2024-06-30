package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.UsingCustomField;
import com.kinga.tasksservice.entity.WorkFlow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UsingCustomFieldRepository extends JpaRepository<UsingCustomField,Long> {
    public List<UsingCustomField> findByCustomFieldIdAndIssueTypeId(Long fieldId, Long typeId);
    public List<UsingCustomField> findByIssueTypeId(Long typeId);
}
