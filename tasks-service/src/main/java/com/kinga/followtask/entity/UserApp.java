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
public class UserApp {
    @Id
    private String id;
    @Transient
    private String codeValidation;
    private String username;
    private String password;
    @Transient
    private String confirm;
    private String pass;
    private String firstName;
    private String lastName;
    private String contact;
    private String email;
    private String address;
    private String cin;
    private String photo;
    private Integer code;
    @ManyToMany
    private List<MemberGroupe> groupes;
    @OneToMany(mappedBy = "userApp")
    private List<Operation> operations;
    @OneToMany(mappedBy = "reporter")
    private List<Issue> repotrers;
    @OneToMany(mappedBy = "userApp")
    private List<EntryTime> entryTimes;
    @OneToMany(mappedBy = "user")
    private List<PlanningEvent> events;
    @OneToMany
    private List<UserCustomFieldValue> userValues;

    public String getFullName() {
       return this.lastName +" "+this.firstName;
    }
}
