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
public class GroupeUser {
    public static String SYSTEM_GROUPE= "SYSTEM_GROUPE";
    public static String PROJECT_GROUPE = "PROJECT_GROUPE";
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String prefix;
    private String type;
    private String name;
    @OneToMany(mappedBy = "groupe")
    private List<MemberGroupe> members;
}
