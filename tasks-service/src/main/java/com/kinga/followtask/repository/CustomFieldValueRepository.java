package com.kinga.followtask.repository;

import com.kinga.followtask.entity.CustomFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomFieldValueRepository extends JpaRepository<CustomFieldValue, Long> {
  }
