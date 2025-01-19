package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Canall {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    @OneToMany
    List<MessageApp> messageApp;
    @OneToMany
    List<CanalMember> members;
    TypeCanal typeCanal;
    @ManyToOne
    private Project projects;
    @ManyToOne
    private Issue issueMaster;
}
