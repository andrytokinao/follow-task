package com.kinga.followtask.service;

import com.kinga.followtask.dto.rapport.RapportCompositeDTO;
import com.kinga.followtask.dto.rapport.RapportEquipeDTO;
import com.kinga.followtask.dto.rapport.RapportPersonneDTO;
import com.kinga.followtask.dto.rapport.RapportPersonnesDTO;
import com.kinga.followtask.dto.rapport.RapportProjetDTO;
import com.kinga.followtask.dto.rapport.RapportProjetsDTO;
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
import java.util.List;
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
    private static final String TEMPLATE_COMPOSITE = "rapport-composite";
    private static final String VARIABLE = "rapport";

    /**
     * Un projet du document et son graphique de répartition.
     *
     * <p>Ces trois types relèvent du rendu et non de la donnée : le graphique
     * est une image peinte pour le document, il n'a rien à faire dans le DTO
     * que consomme Angular, qui redessine le sien. Les apparier ici évite au
     * template de rapprocher deux listes par leur index — un décalage y
     * attribuerait le camembert d'un projet à un autre sans que rien ne le
     * signale.</p>
     */
    public record SectionProjet(RapportProjetDTO projet, String graphique) {
    }

    /** Une personne du document et la répartition de son temps entre les projets. */
    public record SectionPersonne(RapportPersonneDTO personne, String graphique) {
    }

    /** Une équipe : sa synthèse, son graphique, et le détail de ses membres. */
    public record SectionEquipe(RapportEquipeDTO equipe,
                                String graphique,
                                List<SectionPersonne> personnes) {
    }

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
        return convertir(rendre(rapport, lienBasePdf()), rapport.titre());
    }

    /**
     * HTML du rapport composé — projets, personnes et équipes dans un seul
     * document.
     */
    public String genererHtmlComposite(RapportCompositeDTO rapport) {
        return rendreComposite(rapport, racineNormalisee());
    }

    /** PDF du rapport composé. Mêmes réserves sur les liens que le PDF d'un projet. */
    public byte[] genererPdfComposite(RapportCompositeDTO rapport) {
        return convertir(rendreComposite(rapport, lienBasePdf()), rapport.titre());
    }

    /**
     * Conversion du HTML en PDF.
     *
     * @param designation ce que le document représente, pour que le journal
     *                    d'erreur désigne un rapport et non « un PDF »
     * @throws AppException si la conversion échoue ; un PDF tronqué serait plus
     *                      difficile à diagnostiquer qu'une erreur explicite.
     */
    private byte[] convertir(String html, String designation) {
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
            log.error("Conversion PDF du rapport « {} » impossible", designation, e);
            throw new AppException("Le PDF du rapport n'a pas pu être généré : " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Racine des liens dans un PDF : celle de l'application si elle est connue,
     * {@code null} sinon — un lien relatif ne mène nulle part une fois le
     * fichier sorti de l'application.
     */
    private String lienBasePdf() {
        return StringUtils.hasText(baseUrl) ? racineNormalisee() : null;
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

    /**
     * Rendu du rapport composé.
     *
     * <p>Chaque section reçoit son graphique apparié dans une {@code Section} :
     * le template n'a ainsi jamais à rapprocher deux listes par leur index. Les
     * sections absentes du rapport donnent une liste vide, que le template
     * ignore.</p>
     */
    private String rendreComposite(RapportCompositeDTO rapport, String lienBase) {
        RapportProjetsDTO projets = rapport.projets();
        RapportPersonnesDTO personnes = rapport.personnes();

        Context context = new Context(Locale.FRENCH);
        context.setVariable(VARIABLE, rapport);
        context.setVariable("couleurs", GraphiqueService.COULEURS);
        context.setVariable("lienBase", lienBase);

        context.setVariable("graphiqueProjets", projets == null
                ? null
                : graphiqueService.donutRepartition(projets.synthese().repartitionParPersonne()));
        context.setVariable("sectionsProjet", projets == null
                ? List.of()
                : projets.projets().stream().map(this::sectionProjet).toList());

        context.setVariable("graphiquePersonnes", personnes == null
                ? null
                : graphiqueService.donutRepartition(personnes.synthese().repartitionParPersonne()));
        context.setVariable("sectionsPersonne", personnes == null
                ? List.of()
                : personnes.personnes().stream().map(this::sectionPersonne).toList());

        context.setVariable("sectionsEquipe", rapport.equipes().stream()
                .map(this::sectionEquipe)
                .toList());

        try {
            return templateEngine.process(TEMPLATE_COMPOSITE, context);
        } catch (RuntimeException e) {
            log.error("Rendu Thymeleaf du rapport composé « {} » impossible", rapport.titre(), e);
            throw new AppException("Le rapport n'a pas pu être mis en page : " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private SectionProjet sectionProjet(RapportProjetDTO projet) {
        return new SectionProjet(projet,
                graphiqueService.donutRepartition(projet.synthese().repartitionParPersonne()));
    }

    /**
     * Le graphique d'une personne répartit son temps entre les projets, là où
     * celui d'un projet le répartit entre les intervenants : c'est le même
     * rapport vu de l'autre bout.
     */
    private SectionPersonne sectionPersonne(RapportPersonneDTO personne) {
        return new SectionPersonne(personne,
                graphiqueService.donutRepartitionProjets(personne.repartitionParProjet()));
    }

    private SectionEquipe sectionEquipe(RapportEquipeDTO equipe) {
        return new SectionEquipe(equipe,
                graphiqueService.donutRepartition(equipe.synthese().repartitionParPersonne()),
                equipe.personnes().stream().map(this::sectionPersonne).toList());
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
