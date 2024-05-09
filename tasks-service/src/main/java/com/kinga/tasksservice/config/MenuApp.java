package com.kinga.tasksservice.config;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuApp {
    private String label;
    private String path;
    private List<String> credancials;
}
