package com.kinga.followtask.repository;

import com.kinga.followtask.entity.UsingCustomField;
import com.kinga.followtask.entity.WorkFlow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UsingCustomFieldRepository extends JpaRepository<UsingCustomField,Long> {
    public List<UsingCustomField> findByCustomFieldIdAndIssueTypeId(Long fieldId, Long typeId);
    public List<UsingCustomField> findByIssueTypeId(Long typeId);
    public List<UsingCustomField> findByCustomFieldId(Long fieldId);
}
