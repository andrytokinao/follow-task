package com.kinga.followtask.config;

import org.springframework.beans.factory.annotation.Value;

public class StorageConfig {
    @Value("${app.storage.base-path:#{systemProperties['user.home']}}")
    private String basePath;

    public String getBasePath() {
        return basePath;
    }
}
