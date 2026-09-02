package com.kinga.followtask.web;

import com.kinga.followtask.dto.ExportRequestDTO;
import com.kinga.followtask.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Téléchargement des exports Excel.
 *
 * En REST et non en GraphQL : la réponse est un binaire, que GraphQL ne
 * transporte qu'au prix d'un encodage base64 en mémoire des deux côtés.
 */
@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private static final String XLSX_MIME =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private static final DateTimeFormatter STAMP =
            DateTimeFormatter.ofPattern("yyyy-MM-dd_HH'h'mm");

    private final ExportService exportService;

    /** Colonnes que le serveur sait exporter, pour alimenter le menu du client. */
    @GetMapping("/columns")
    public ResponseEntity<List<Map<String, String>>> columns() {
        return ResponseEntity.ok(exportService.availableColumns());
    }

    @PostMapping(value = "/issues", produces = XLSX_MIME)
    public ResponseEntity<Resource> exportIssues(@RequestBody ExportRequestDTO request,
                                                 @RequestParam(required = false) String fileName) throws IOException {
        // Le classeur est assemblé en mémoire : on connaît ainsi sa taille, donc
        // le client affiche une vraie barre de progression, et une erreur de
        // génération renvoie un statut plutôt qu'un fichier tronqué.
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        exportService.export(request, buffer);

        LocalDateTime executedAt = exportService.executedAt();
        String name = buildFileName(fileName, executedAt);
        ByteArrayResource body = new ByteArrayResource(buffer.toByteArray());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + name + "\"")
                // Sans cet en-tête, le navigateur masque Content-Disposition au
                // code JavaScript et le nom du fichier est perdu.
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .contentType(MediaType.parseMediaType(XLSX_MIME))
                .contentLength(body.contentLength())
                .body(body);
    }

    /** Le nom porte la date ET l'heure : deux exports du même jour se
     *  distinguent dans le dossier de téléchargement. */
    private String buildFileName(String requested, LocalDateTime executedAt) {
        String base = (requested == null || requested.isBlank()) ? "export" : requested;
        base = base.replaceAll("[\\\\/:*?\"<>|]", "-");
        if (base.toLowerCase().endsWith(".xlsx")) {
            base = base.substring(0, base.length() - 5);
        }
        return base + "-" + STAMP.format(executedAt) + ".xlsx";
    }
}
