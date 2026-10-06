package com.kinga.followtask.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailsDeto {
    private String id;
    private String username;
    private String password;
    private String firstName ;
    private String lastName;
    private String photo;
    private Set<String> permissions = new HashSet<>();
    private boolean active = true;

    public UserDetailsDeto(String id, String username, String password, String firstName,
                           String lastName, String photo, Set<String> permissions) {
        this(id, username, password, firstName, lastName, photo, permissions, true);
    }
}
