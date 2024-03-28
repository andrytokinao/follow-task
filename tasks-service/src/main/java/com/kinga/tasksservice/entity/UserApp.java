package com.kinga.tasksservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserApp {
    @Id
    private String id;
    private String username;
    private String password;
    private String pass;
    private String firstName;
    private String lastName;
    private String contact;
    private String email;
    private String cin;
    private String photo;
    @ManyToMany
    private List<MemberGroupe> groupes;
    @OneToMany(mappedBy = "userApp")
    private List<Operation> operations;
    @OneToMany(mappedBy = "reporter")
    private List<Issue> repotrers;
    @OneToMany(mappedBy = "userApp")
    private List<EntryTime> entryTimes;
    @OneToMany
    private List<UserCustomFieldValue> userValues;

}
