package com.kinga.tasksservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailsDeto {
    private String username;
    private String password;
    private Set<String> permissions = new HashSet<>();
}
