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
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;
    @OneToMany(mappedBy = "canall")
    List<MessageApp> messageApp;
    private String pseudo;
    @OneToMany(mappedBy = "canall")
    List<CanalMember> members;
    @Transient
    List<String> membersIds;
    TypeCanal typeCanal;
    @ManyToOne
    private Project projects;
    @ManyToOne
    private Issue issueMaster;
}
