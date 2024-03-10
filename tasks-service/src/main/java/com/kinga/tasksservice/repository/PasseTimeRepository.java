package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.EntryTime;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasseTimeRepository extends JpaRepository<EntryTime,Long> {
}
