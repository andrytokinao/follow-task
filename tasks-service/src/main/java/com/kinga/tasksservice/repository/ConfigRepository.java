package com.kinga.tasksservice.repository;

import com.kinga.tasksservice.entity.ConfigEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConfigRepository extends JpaRepository<ConfigEntry , Long> {
    public List<ConfigEntry> findByType(String type);
}
