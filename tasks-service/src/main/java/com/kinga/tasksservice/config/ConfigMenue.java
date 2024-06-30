package com.kinga.tasksservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

@Component
@Configuration
@Data
@ConfigurationProperties(prefix = "application-menue")
public class ConfigMenue {
    private ModuleMenue installations;
    private ModuleMenue creationProject;
    private ModuleMenue privateMenue;

}
