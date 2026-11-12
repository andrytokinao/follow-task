package com.kinga.followtask.service;

import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.stereotype.Service;

@Service
public class PermissionService {
    public boolean has(String userId, String permission, String projetId) {
        return true;
    }
}
