package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.Value;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface ValueRepository extends JpaRepository<Value,Long> {

    public List<Value> findByIssueId(Long id);

}
