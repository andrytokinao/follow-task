package com.kinga.tasksservice.config;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

@Component
@Configuration
@Data
@ConfigurationProperties(prefix = "configuration-system")
public class ConfigSystem {
    private String profileDirectories;
    private String defaultTaskDirectories;

}
