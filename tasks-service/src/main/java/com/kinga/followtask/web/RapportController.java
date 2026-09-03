package com.kinga.followtask.web;

import com.kinga.followtask.dto.rapport.RapportProjetDTO;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.exception.AppException;
import com.kinga.followtask.service.PdfGenerationService;
import com.kinga.followtask.service.RapportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Rapport d'avancement d'un projet, dans ses trois formats.
 *
 * Les trois routes partagent la même construction de données
 * ({@code RapportService}) : seul le rendu change.
 */
@RestController
@RequestMapping("/api/rapports")
@RequiredArgsConstructor
public class RapportController {

    private final RapportService rapportService;
    private final PdfGenerationService pdfGenerationService;

    /** Données du rapport, pour l'aperçu natif Angular. */
    @GetMapping("/{issueId}")
    public RapportProjetDTO rapport(@PathVariable Long issueId) {
        return rapportService.genererRapport(rapportService.chargerIssueRacine(issueId));
    }

    /** Rapport en PDF, à télécharger. */
    @GetMapping(value = "/{issueId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<Resource> pdf(@PathVariable Long issueId) {
        Issue issueProjet = rapportService.chargerIssueRacine(issueId);
        RapportProjetDTO rapport = rapportService.genererRapport(issueProjet);
        ByteArrayResource corps = new ByteArrayResource(pdfGenerationService.genererPdfRapport(rapport));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + nomFichier(issueProjet) + "\"")
                // Sans cet en-tête, le navigateur masque Content-Disposition au
                // code JavaScript et le nom du fichier est perdu.
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(corps.contentLength())
                .body(corps);
    }

    /**
     * HTML brut du template, pour prévisualiser côté serveur exactement ce que
     * la conversion PDF recevra.
     */
    @GetMapping(value = "/{issueId}/html", produces = MediaType.TEXT_HTML_VALUE + ";charset=UTF-8")
    public String html(@PathVariable Long issueId) {
        return pdfGenerationService.genererHtmlRapport(
                rapportService.genererRapport(rapportService.chargerIssueRacine(issueId)));
    }

    /**
     * Échec de mise en page ou de conversion : renvoyé tel quel plutôt que
     * masqué derrière une erreur générique.
     */
    @ExceptionHandler(AppException.class)
    public ResponseEntity<Map<String, String>> handleRenditionError(AppException e) {
        return ResponseEntity.status(e.getStatus()).body(Map.of("error", e.getMessage()));
    }

    private String nomFichier(Issue issueProjet) {
        String cle = StringUtils.hasText(issueProjet.getIssueKey())
                ? issueProjet.getIssueKey()
                : String.valueOf(issueProjet.getId());
        return "rapport-" + cle.replaceAll("[\\\\/:*?\"<>|]", "-") + ".pdf";
    }
}
