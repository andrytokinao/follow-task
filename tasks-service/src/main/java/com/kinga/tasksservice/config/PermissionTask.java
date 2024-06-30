package com.kinga.tasksservice.config;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Data
@Configuration
@ConfigurationProperties(prefix = "task-authorization")
public class PermissionTask {
    private List<RoleApp> roles;

    public List<RoleApp> getRoles() {
        return roles;
    }

}

