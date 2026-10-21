package com.kinga.followtask.web;

import com.kinga.followtask.dto.outil.FichierOutilVue;
import com.kinga.followtask.service.outil.FichierOutilService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Set;

/**
 * Fichiers des outils (DT-019), en REST : l'envoi et le telechargement de
 * fichiers ne passent pas par GraphQL. La suppression, elle, est une mutation.
 * Les droits sont verifies a chaque appel par {@link FichierOutilService}.
 */
@RestController
@RequestMapping("/api/outils")
@RequiredArgsConstructor
public class OutilFichierController {

    /**
     * Types qu'un navigateur peut afficher sans risque. Tout le reste (HTML,
     * SVG...) part en telechargement : un fichier depose ne s'execute jamais
     * dans l'application.
     */
    private static final Set<String> AFFICHABLES = Set.of("video", "audio", "image/png", "image/jpeg", "application/pdf");

    private final FichierOutilService fichierService;

    @PostMapping(path = "/{outilId}/fichiers", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public FichierOutilVue deposer(@PathVariable Long outilId, @RequestPart("file") MultipartFile file) {
        return fichierService.deposer(outilId, file);
    }

    /** {@code apercu=true} : affiche dans le navigateur (lecteur video, PDF) au lieu de telecharger. */
    @GetMapping("/fichiers/{fichierId}")
    public ResponseEntity<Resource> telecharger(@PathVariable Long fichierId,
                                                @RequestParam(defaultValue = "false") boolean apercu) {
        FichierOutilService.Telechargement fichier = fichierService.telecharger(fichierId);
        boolean enLigne = apercu && affichable(fichier.type());
        ContentDisposition disposition = (enLigne ? ContentDisposition.inline() : ContentDisposition.attachment())
                .filename(fichier.nom(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(enLigne ? fichier.type() : MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(new FileSystemResource(fichier.chemin()));
    }

    private static boolean affichable(MediaType type) {
        return AFFICHABLES.contains(type.getType()) || AFFICHABLES.contains(type.getType() + "/" + type.getSubtype());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> refuse(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> interdit(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> introuvable(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }
}
