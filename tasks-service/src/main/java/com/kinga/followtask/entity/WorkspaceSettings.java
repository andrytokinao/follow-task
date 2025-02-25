package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@DiscriminatorValue("WORKSPACE")
@Data
public class WorkspaceSettings extends AppSettings {
    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private Project project;

    public WorkspaceSettings() {}


}
