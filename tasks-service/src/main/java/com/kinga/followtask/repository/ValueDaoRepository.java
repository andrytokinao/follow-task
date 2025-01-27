package com.kinga.followtask.repository;

import com.kinga.followtask.entity.CustomFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ValueDaoRepository extends JpaRepository<CustomFieldValue,Long> {
    public List<CustomFieldValue> findCustomFieldValueByIssueId(Long id);
}
