package com.kinga.followtask.web;

import com.kinga.followtask.config.Autorities;
import com.kinga.followtask.dto.DemandeImportAnnuaire;
import com.kinga.followtask.dto.RapportImportUsers;
import com.kinga.followtask.service.annuaire.ImportAnnuaireService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Import d'utilisateurs depuis un annuaire externe, à partir de l'adresse de
 * leurs fiches.
 *
 * <p>Même droit et même forme de rapport que l'import par tableur
 * ({@link UserImportController}).</p>
 */
@RestController
@RequiredArgsConstructor
public class AnnuaireImportController {

    private static final Logger logger = LoggerFactory.getLogger(AnnuaireImportController.class);

    private final ImportAnnuaireService importAnnuaireService;

    /** Lit les fiches et signale les doublons, sans rien créer. */
    @Autorities.CanCreateUser
    @PostMapping("/api/users/import/annuaire/apercu")
    public ResponseEntity<?> apercu(@RequestBody List<String> references) {
        try {
            return ResponseEntity.ok(importAnnuaireService.apercu(references));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Répond 200 même si des fiches sont rejetées ou ignorées : le détail est dans le rapport. */
    @Autorities.CanCreateUser
    @PostMapping("/api/users/import/annuaire")
    public ResponseEntity<?> importer(@RequestBody DemandeImportAnnuaire demande) {
        try {
            RapportImportUsers rapport = importAnnuaireService.importer(demande);
            logger.info("Import annuaire : {} fiche(s), {} créé(s), {} ignoré(s), {} rejeté(s)",
                    rapport.total(), rapport.crees(), rapport.ignores(), rapport.rejetes());
            return ResponseEntity.ok(rapport);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
