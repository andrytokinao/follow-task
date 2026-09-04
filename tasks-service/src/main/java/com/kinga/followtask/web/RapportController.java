package com.kinga.followtask.web;

import com.kinga.followtask.dto.rapport.DemandeRapportDTO;
import com.kinga.followtask.dto.rapport.OptionsRapportDTO;
import com.kinga.followtask.dto.rapport.RapportCompositeDTO;
import com.kinga.followtask.dto.rapport.RapportProjetDTO;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.exception.AppException;
import com.kinga.followtask.service.PdfGenerationService;
import com.kinga.followtask.service.RapportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.text.Normalizer;
import java.util.Map;

/**
 * Rapports : celui d'un projet, dans ses trois formats, et le rapport composé
 * édité depuis l'espace de travail.
 *
 * Toutes les routes partagent la même construction de données
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

    // ------------------------------------------------------------------
    // Rapport composé, édité depuis l'espace de travail
    // ------------------------------------------------------------------

    /**
     * Ce que l'espace de travail offre à la sélection : ses projets, ses
     * membres, ses équipes.
     *
     * <p>En un seul appel, parce que le formulaire de création montre les trois
     * listes ensemble : les charger séparément le ferait apparaître par
     * morceaux.</p>
     */
    @GetMapping("/options")
    public OptionsRapportDTO options(@RequestParam Long projectId) {
        return rapportService.optionsRapport(projectId);
    }

    /** Données du rapport composé, pour l'aperçu natif Angular. */
    @PostMapping("/composite")
    public RapportCompositeDTO composite(@RequestBody DemandeRapportDTO demande) {
        return rapportService.genererRapportComposite(demande);
    }

    /**
     * Rapport composé en PDF.
     *
     * <p>En POST bien qu'il ne crée rien : la sélection peut porter sur des
     * dizaines de projets et de personnes, une URL ne la transporterait pas de
     * façon fiable.</p>
     */
    @PostMapping(value = "/composite/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<Resource> compositePdf(@RequestBody DemandeRapportDTO demande) {
        RapportCompositeDTO rapport = rapportService.genererRapportComposite(demande);
        ByteArrayResource corps = new ByteArrayResource(pdfGenerationService.genererPdfComposite(rapport));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + nomFichier(rapport) + "\"")
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(corps.contentLength())
                .body(corps);
    }

    /** HTML brut du rapport composé, pour prévisualiser ce que le PDF recevra. */
    @PostMapping(value = "/composite/html", produces = MediaType.TEXT_HTML_VALUE + ";charset=UTF-8")
    public String compositeHtml(@RequestBody DemandeRapportDTO demande) {
        return pdfGenerationService.genererHtmlComposite(
                rapportService.genererRapportComposite(demande));
    }

    // ------------------------------------------------------------------
    // Erreurs
    // ------------------------------------------------------------------

    /**
     * Échec de mise en page ou de conversion : renvoyé tel quel plutôt que
     * masqué derrière une erreur générique.
     */
    @ExceptionHandler(AppException.class)
    public ResponseEntity<Map<String, String>> handleRenditionError(AppException e) {
        return ResponseEntity.status(e.getStatus()).body(Map.of("error", e.getMessage()));
    }

    /**
     * Sélection irrecevable : rapport vide, sous-tâche sans rapport propre,
     * espace de travail manquant. Le message du service dit précisément quoi
     * corriger, l'affichage le reprend tel quel.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleSelectionInvalide(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    }

    /** Demande, espace de travail ou équipe introuvable. */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIntrouvable(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    private String nomFichier(Issue issueProjet) {
        String cle = StringUtils.hasText(issueProjet.getIssueKey())
                ? issueProjet.getIssueKey()
                : String.valueOf(issueProjet.getId());
        return "rapport-" + assainir(cle) + ".pdf";
    }

    /**
     * Nom du fichier d'un rapport composé, tiré de son titre : c'est sous ce
     * nom que l'utilisateur le retrouvera dans ses téléchargements.
     */
    private String nomFichier(RapportCompositeDTO rapport) {
        String titre = StringUtils.hasText(rapport.titre()) ? rapport.titre() : "rapport";
        return assainir(titre) + ".pdf";
    }

    /**
     * Nom de fichier sûr : les accents sont dépliés et tout ce qu'un système de
     * fichiers refuse devient un tiret. Un en-tête Content-Disposition ne
     * transporte de toute façon pas d'octets non-ASCII sans encodage.
     */
    private String assainir(String valeur) {
        String sansAccent = Normalizer.normalize(valeur, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String nom = sansAccent.replaceAll("[^A-Za-z0-9._-]+", "-")
                .replaceAll("^-+|-+$", "");
        return nom.isEmpty() ? "rapport" : nom;
    }
}
