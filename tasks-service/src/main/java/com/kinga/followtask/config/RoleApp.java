package com.kinga.followtask.config;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleApp {
    private String name;
    private String description;
    private List<String> accessibilities;
    /** Roles dont celui-ci herite toutes les accessibilites (hierarchie). */
    private List<String> includes;

}
