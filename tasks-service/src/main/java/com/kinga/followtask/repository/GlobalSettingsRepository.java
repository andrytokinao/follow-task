package com.kinga.followtask.repository;

import com.kinga.followtask.entity.AppSettings;
import com.kinga.followtask.entity.GlobalSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GlobalSettingsRepository extends JpaRepository<GlobalSettings, Long> {
    public List<GlobalSettings> findByActiveAndCle(boolean active,String cle);
}
