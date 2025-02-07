package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LabelRepository extends JpaRepository<Label, Long> {
    List<Label> findByName(String name);
    List<Label> findByNameIn(List<String> names);

    List<Label> findByProjectId(Long projetId);
}
