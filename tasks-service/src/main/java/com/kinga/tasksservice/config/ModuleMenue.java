package com.kinga.tasksservice.config;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModuleMenue {
    private String route;
    private List<MenuApp> menues;
}
