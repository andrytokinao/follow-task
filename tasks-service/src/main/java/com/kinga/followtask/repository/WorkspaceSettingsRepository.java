package com.kinga.followtask.repository;

import com.kinga.followtask.entity.AppSettings;
import com.kinga.followtask.entity.WorkspaceSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import javax.swing.plaf.PanelUI;
import java.util.List;

public interface WorkspaceSettingsRepository extends JpaRepository<WorkspaceSettings, Long> {
    public List<WorkspaceSettings> findByProjectIdAndActiveAndCle(Long workspaceId , Boolean active, String cle);

    List<WorkspaceSettings> findByProjectIdAndActive(Long projectId, boolean b);
}
