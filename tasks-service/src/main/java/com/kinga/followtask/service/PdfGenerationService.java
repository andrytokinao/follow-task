package com.kinga.followtask.service;

import com.kinga.followtask.dto.rapport.RapportProjetDTO;
import com.kinga.followtask.exception.AppException;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Locale;

/**
 * Rendu du rapport de projet en HTML puis en PDF.
 *
 * Le PDF n'est pas une mise en page distincte : il est produit à partir du HTML
 * du template {@code rapport-projet.html}, donc une correction d'affichage
 * profite aux deux formats sans risque de divergence.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PdfGenerationService {

    private static final String TEMPLATE = "rapport-projet";
    private static final String VARIABLE = "rapport";

    private final TemplateEngine templateEngine;
    private final GraphiqueService graphiqueService;

    /** HTML du rapport, tel que servi par l'endpoint de prévisualisation. */
    public String genererHtmlRapport(RapportProjetDTO rapport) {
        Context context = new Context(Locale.FRENCH);
        context.setVariable(VARIABLE, rapport);
        // Le graphique et sa palette relèvent du rendu, pas de la donnée : ils
        // sont ajoutés ici plutôt que dans le DTO, qui reste ainsi une réponse
        // JSON légère pour Angular.
        context.setVariable("graphiqueRepartition",
                graphiqueService.donutRepartition(rapport.synthese().repartitionParPersonne()));
        context.setVariable("couleurs", GraphiqueService.COULEURS);
        try {
            return templateEngine.process(TEMPLATE, context);
        } catch (RuntimeException e) {
            // Une expression cassée dans le template remonte ici : la laisser
            // filer donnerait une page blanche sans indication de la cause.
            log.error("Rendu Thymeleaf du rapport « {} » impossible", rapport.titre(), e);
            throw new AppException("Le rapport n'a pas pu être mis en page : " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * PDF du rapport.
     *
     * @throws AppException si la mise en page ou la conversion échoue ; un PDF
     *                      tronqué serait plus difficile à diagnostiquer qu'une
     *                      erreur explicite.
     */
    public byte[] genererPdfRapport(RapportProjetDTO rapport) {
        String html = genererHtmlRapport(rapport);

        try (ByteArrayOutputStream sortie = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            // Aucune URI de base : le template est autonome (CSS en ligne, pas
            // d'image ni de police externe à résoudre).
            builder.withHtmlContent(html, null);
            builder.toStream(sortie);
            builder.run();
            return sortie.toByteArray();
        } catch (IOException | RuntimeException e) {
            log.error("Conversion PDF du rapport « {} » impossible", rapport.titre(), e);
            throw new AppException("Le PDF du rapport n'a pas pu être généré : " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
