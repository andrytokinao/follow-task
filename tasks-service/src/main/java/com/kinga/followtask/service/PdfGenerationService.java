package com.kinga.followtask.service;

import com.kinga.followtask.dto.rapport.RapportProjetDTO;
import com.kinga.followtask.exception.AppException;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
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
public class PdfGenerationService {

    private static final String TEMPLATE = "rapport-projet";
    private static final String VARIABLE = "rapport";

    private final TemplateEngine templateEngine;
    private final GraphiqueService graphiqueService;

    /**
     * Adresse publique de l'application, si elle est connue. Vide par défaut :
     * derrière un proxy, le serveur ne peut pas la deviner de façon fiable.
     */
    private final String baseUrl;

    public PdfGenerationService(TemplateEngine templateEngine,
                                GraphiqueService graphiqueService,
                                @Value("${app.base-url:}") String baseUrl) {
        this.templateEngine = templateEngine;
        this.graphiqueService = graphiqueService;
        this.baseUrl = baseUrl;
    }

    /**
     * HTML du rapport, tel que servi par l'endpoint de prévisualisation.
     *
     * La page étant servie par l'application elle-même, les clés peuvent
     * pointer vers les demandes en adressage relatif, sans configuration.
     */
    public String genererHtmlRapport(RapportProjetDTO rapport) {
        return rendre(rapport, racineNormalisee());
    }

    /**
     * PDF du rapport.
     *
     * <p>Les clés n'y sont cliquables que si {@code app.base-url} est
     * renseigné : un PDF se lit hors de l'application, souvent hors du réseau,
     * et un lien relatif n'y mène nulle part. Sans cette configuration, les
     * clés restent du texte — ce qui suffit à retrouver une demande.</p>
     *
     * @throws AppException si la mise en page ou la conversion échoue ; un PDF
     *                      tronqué serait plus difficile à diagnostiquer qu'une
     *                      erreur explicite.
     */
    public byte[] genererPdfRapport(RapportProjetDTO rapport) {
        String html = rendre(rapport, StringUtils.hasText(baseUrl) ? racineNormalisee() : null);

        try (ByteArrayOutputStream sortie = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            // Aucune URI de base : le template est autonome (CSS en ligne,
            // graphique encodé en base64, pas de ressource externe à résoudre).
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

    /**
     * @param lienBase racine des liens vers les demandes : chaîne vide pour un
     *                 adressage relatif, adresse absolue si elle est connue, ou
     *                 {@code null} pour ne produire aucun lien.
     */
    private String rendre(RapportProjetDTO rapport, String lienBase) {
        Context context = new Context(Locale.FRENCH);
        context.setVariable(VARIABLE, rapport);
        // Le graphique, sa palette et la racine des liens relèvent du rendu, pas
        // de la donnée : ils sont ajoutés ici plutôt que dans le DTO, qui reste
        // ainsi une réponse JSON légère pour Angular.
        context.setVariable("graphiqueRepartition",
                graphiqueService.donutRepartition(rapport.synthese().repartitionParPersonne()));
        context.setVariable("couleurs", GraphiqueService.COULEURS);
        context.setVariable("lienBase", lienBase);

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

    /** Racine sans barre finale : le template ajoute la sienne. */
    private String racineNormalisee() {
        if (!StringUtils.hasText(baseUrl)) {
            return "";
        }
        String racine = baseUrl.trim();
        return racine.endsWith("/") ? racine.substring(0, racine.length() - 1) : racine;
    }
}
