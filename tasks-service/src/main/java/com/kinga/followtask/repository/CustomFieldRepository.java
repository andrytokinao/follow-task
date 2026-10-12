package com.kinga.followtask.repository;

import com.kinga.followtask.entity.CustomField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomFieldRepository extends JpaRepository<CustomField,Long> {
    public List<CustomField> findByProjectId(Long projectId);
    /** Champs de l'espace de travail, plus ceux partages par tous les espaces. */
    List<CustomField> findByProjectIdOrPortee(Long projectId, String portee);
    List<CustomField> findByProjectIdAndPortee(Long projectId, String portee);
    List<CustomField> findByPortee(String portee);
    List<CustomField> findByCode(String code);
}
