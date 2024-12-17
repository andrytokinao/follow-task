package com.kinga.followtask.repository;

import com.kinga.followtask.entity.EventType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventTypeRepository extends JpaRepository<EventType , Long> {
}
