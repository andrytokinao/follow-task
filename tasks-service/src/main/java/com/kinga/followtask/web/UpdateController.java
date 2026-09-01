package com.kinga.followtask.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
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

    @Value("${project.version}")
    private String projectVersion;

    /**
     * Point d'entree public (voir WebSecurityConfig : /api/updates/** en
     * permitAll) : la verification de version tourne au demarrage, avant toute
     * session, y compris sur les pages publiques.
     */
    @GetMapping("/check")
    public ResponseEntity<?> checkUpdate() {
        return ResponseEntity.ok()
                // no-store : une version mise en cache par un intermediaire
                // ferait rater la mise a jour a tous les clients derriere lui.
                .cacheControl(CacheControl.noStore())
                .body(Map.of(
                        "version",     appVersion,           // ex: "1.1"
                        "project",     projectVersion,           // ex: "1.1.100"
                        "url",         "/updates/v" + appVersion + ".zip",
                        "mandatory",   false
                ));
    }
}