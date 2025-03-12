package com.kinga.followtask.r2dbc.entity;

import com.kinga.followtask.entity.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.util.List;

@Table(name = "canall")
public class Canall {
    @Id
    private Long id;
    List<MessageApp> messageApp;
    List<CanalMember> members;
    TypeCanal typeCanal;
    private Project projects;
    private Issue issueMaster;
}
