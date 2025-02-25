package com.kinga.followtask.repository;

import com.kinga.followtask.entity.AppSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppSettingsRepository extends JpaRepository<AppSettings, Long> {
    public List<AppSettings> findByActive(boolean active);
}
