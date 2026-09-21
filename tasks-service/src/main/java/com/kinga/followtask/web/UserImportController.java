package com.kinga.followtask.web;

import com.kinga.followtask.config.Autorities;
import com.kinga.followtask.dto.RapportImportUsers;
import com.kinga.followtask.service.UserImportService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

/**
 * Import d'utilisateurs par tableur.
 *
 * <p>En REST et non en GraphQL : le schéma ne transporte pas de fichier. C'est
 * déjà le choix fait pour la photo de profil ({@code /api/upload/photo}).</p>
 */
@RestController
@RequiredArgsConstructor
public class UserImportController {

    private static final Logger logger = LoggerFactory.getLogger(UserImportController.class);

    private static final String TYPE_XLSX =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private final UserImportService userImportService;

    /**
     * Dépose un classeur et crée les utilisateurs qu'il décrit.
     *
     * <p>Répond 200 même quand des lignes ont été rejetées : l'import est
     * partiel par nature, et le détail est dans le rapport. Seul un fichier
     * illisible dans son ensemble vaut un 400.</p>
     */
    @Autorities.CanCreateUser
    @PostMapping("/api/users/import")
    public ResponseEntity<?> importer(@RequestPart("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("Aucun fichier reçu.");
        }
        try (InputStream flux = file.getInputStream()) {
            RapportImportUsers rapport = userImportService.importer(flux);
            logger.info("Import utilisateurs : {} ligne(s), {} créé(s), {} rejeté(s)",
                    rapport.total(), rapport.crees(), rapport.rejetes());
            return ResponseEntity.ok(rapport);
        } catch (IOException e) {
            logger.warn("Import utilisateurs : classeur illisible", e);
            return ResponseEntity.badRequest()
                    .body("Fichier illisible : " + e.getMessage());
        }
    }

    /** Classeur vierge, en-têtes et ligne d'exemple. */
    @Autorities.CanCreateUser
    @GetMapping("/api/users/import/modele")
    public void modele(HttpServletResponse response) throws IOException {
        response.setContentType(TYPE_XLSX);
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"modele-import-utilisateurs.xlsx\"");
        userImportService.ecrireModele(response.getOutputStream());
        response.flushBuffer();
    }
}
