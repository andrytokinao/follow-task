package com.kinga.followtask.repository;

import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.enumapp.Niveau;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssueTypeRepository extends JpaRepository<IssueType,Long> {
    List<IssueType> findByProjectId(Long projectId);
    List<IssueType> findByProjectIdAndLevel(Long projectId, Niveau level);
    List<IssueType> findByParentId(Long parentId);

}
