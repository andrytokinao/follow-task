package com.kinga.followtask.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/updates")
public class UpdateController {

    @Value("${app.version}")
    private String appVersion;

    @GetMapping("/check")
    public ResponseEntity<?> checkUpdate() {
        return ResponseEntity.ok(Map.of(
                "version",     appVersion,           // ex: "1.1"
                "url",         "/updates/v" + appVersion + ".zip",
                "mandatory",   false
        ));
    }
}