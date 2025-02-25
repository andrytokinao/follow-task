package com.kinga.followtask.repository;

import com.kinga.followtask.entity.AppSettings;
import com.kinga.followtask.entity.UserSettings;
import com.kinga.followtask.entity.WorkspaceSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {
    public List<UserSettings> findByActiveAndCleAndUserId(boolean active, String cle , String userId);

    List<UserSettings> findByUserId(String userId);
}
