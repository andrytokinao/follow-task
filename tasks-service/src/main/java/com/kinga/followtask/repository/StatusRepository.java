package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StatusRepository extends JpaRepository<Status,Long> {
    public List<Status> findByDisplayName(String displayName);
}
