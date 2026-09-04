package com.kinga.tasksservice.service;

import com.kinga.followtask.dto.rapport.DemandeRapportDTO;
import com.kinga.followtask.dto.rapport.RapportCompositeDTO;
import com.kinga.followtask.dto.rapport.RapportEquipeDTO;
import com.kinga.followtask.dto.rapport.RapportPersonneDTO;
import com.kinga.followtask.dto.rapport.RapportPersonnesDTO;
import com.kinga.followtask.dto.rapport.RapportProjetDTO;
import com.kinga.followtask.dto.rapport.RapportProjetsDTO;
import com.kinga.followtask.dto.rapport.StatutTache;
import com.kinga.followtask.dto.rapport.SynthesePersonnesDTO;
import com.kinga.followtask.dto.rapport.SyntheseProjetDTO;
import com.kinga.followtask.dto.rapport.SyntheseProjetsDTO;
import com.kinga.followtask.dto.rapport.TachePersonneDTO;
import com.kinga.followtask.dto.rapport.TacheRapportDTO;
import com.kinga.followtask.dto.rapport.TempsParPersonneDTO;
import com.kinga.followtask.dto.rapport.TempsParProjetDTO;
import com.kinga.followtask.repository.EventRepository;
import com.kinga.followtask.repository.GroupeUserRepository;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.ProjectRepository;
import com.kinga.followtask.repository.UserAppRepository;
import com.kinga.followtask.service.GraphiqueService;
import com.kinga.followtask.service.IconeRapportService;
import com.kinga.followtask.service.PdfGenerationService;
import com.kinga.followtask.service.RapportService;
import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

/**
 * Mise en page du rapport composé.
 *
 * <p>Un template Thymeleaf ne se compile pas : une signature de fragment
 * changée ou un champ renommé ne se voit qu'au moment où quelqu'un édite le
 * document. Ce test rend le rapport le plus complet possible — projets,
 * personnes, équipes — pour que cette erreur tombe ici plutôt qu'entre les
 * mains de l'utilisateur.</p>
 *
 * <p>Le moteur est monté comme celui de Spring Boot (mêmes préfixe, suffixe et
 * dialecte SpEL) : un test qui passerait avec un autre dialecte ne prouverait
 * rien des expressions réellement évaluées en production.</p>
 */
class RapportCompositeRenduTest {

    private final PdfGenerationService pdfGenerationService = new PdfGenerationService(
            moteur(), new GraphiqueService(), new IconeRapportService(), "");

    @Test
    void leRapportComposeSeMetEnPage() {
        String html = pdfGenerationService.genererHtmlComposite(rapportComplet());

        // Les trois parties sont présentes, chacune avec ce qui la distingue.
        // Le titre est cherché sans son apostrophe : Thymeleaf l'échappe en
        // « &#39; », ce qui est le comportement voulu — c'est du texte saisi.
        assertThat(html).contains("activité de septembre");
        assertThat(html).contains("Projets").contains("Refonte du portail").contains("PRJ-1");
        assertThat(html).contains("Activité par personne").contains("Rakoto Jean");
        assertThat(html).contains("Équipe - Équipe technique");

        // Les chiffres traversent la mise en page : une tuile vide passerait
        // inaperçue à la relecture du template.
        assertThat(html).contains("12,5").contains("Écart réalisé / planifié");

        // Le fragment de projet est bien celui du rapport individuel.
        assertThat(html).contains("Détail des tâches").contains("Maquettes");
        // Et celui de personne porte son propre point de vue.
        assertThat(html).contains("Répartition de son temps par projet");
    }

    /**
     * La couverture annonce le contenu du document : un rapport composé n'a pas
     * deux fois la même structure, on ne peut pas la deviner de l'extérieur.
     */
    @Test
    void laCouvertureAnnonceLeContenu() {
        String html = pdfGenerationService.genererHtmlComposite(rapportComplet());

        assertThat(html).contains("Contenu du document");
        assertThat(html).contains("Activité par personne").contains("Équipes");
        // Les icônes sont peintes puis encodées : le convertisseur PDF ne sait
        // lire ni police d'icônes ni SVG.
        assertThat(html).contains("data:image/png;base64,");
    }

    /**
     * Numérotation : « 2) » en tête d'un projet et dans le sommaire, « 2.1 »
     * sur ses tâches — de quoi désigner une tâche à l'oral, ce que sa clé ne
     * permet pas.
     */
    @Test
    void lesProjetsEtLeursTachesSontNumerotes() {
        String html = pdfGenerationService.genererHtmlComposite(rapportComplet());

        assertThat(html).contains("1)");
        assertThat(html).contains("1.1");
    }

    /**
     * Sans adresse publique configurée, l'aperçu HTML est servi par
     * l'application elle-même : les clés y pointent vers les demandes en
     * adressage relatif.
     */
    @Test
    void lesClesPointentVersLesDemandes() {
        String html = pdfGenerationService.genererHtmlComposite(rapportComplet());

        assertThat(html).contains("/working/PRJ/issue/PRJ-1/details");
        assertThat(html).contains("/working/PRJ/issue/PRJ-1/subtask/PRJ-2");
    }

    /**
     * Le PDF est produit à partir de ce même HTML par un convertisseur qui le
     * parse comme du XML : une balise mal fermée dans un template passerait
     * inaperçue à l'écran et ferait échouer l'édition du document.
     */
    @Test
    void leRapportComposeSeConvertitEnPdf() {
        byte[] pdf = pdfGenerationService.genererPdfComposite(rapportComplet());

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 5, StandardCharsets.ISO_8859_1)).isEqualTo("%PDF-");
    }

    /**
     * Une sélection vide est une erreur d'appel, pas un rapport vide : produire
     * un document sans contenu laisserait croire que l'espace de travail n'a
     * rien à montrer.
     */
    @Test
    void uneSelectionVideEstRefusee() {
        RapportService service = new RapportService(
                mock(IssueRepository.class),
                mock(EventRepository.class),
                mock(ProjectRepository.class),
                mock(UserAppRepository.class),
                mock(GroupeUserRepository.class));

        assertThatThrownBy(() -> service.genererRapportComposite(
                new DemandeRapportDTO(1L, null, List.of(), List.of(), List.of())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("au moins un projet");
    }

    /**
     * L'activité d'une personne se mesure sur un espace de travail : sans lui,
     * le rapport porterait sur des heures passées n'importe où.
     */
    @Test
    void unRapportParPersonneExigeUnEspaceDeTravail() {
        RapportService service = new RapportService(
                mock(IssueRepository.class),
                mock(EventRepository.class),
                mock(ProjectRepository.class),
                mock(UserAppRepository.class),
                mock(GroupeUserRepository.class));

        assertThatThrownBy(() -> service.genererRapportComposite(
                new DemandeRapportDTO(null, null, List.of(), List.of("u1"), List.of())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Espace de travail");
    }

    // ------------------------------------------------------------------
    // Montage
    // ------------------------------------------------------------------

    static SpringTemplateEngine moteur() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(false);

        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        return engine;
    }

    /** Un rapport portant les trois parties à la fois, cas le plus exigeant. */
    static RapportCompositeDTO rapportComplet() {
        return new RapportCompositeDTO(
                "Rapport d'activité de septembre",
                "Direction technique",
                "PRJ",
                LocalDateTime.now(),
                projets(),
                personnes(),
                List.of(new RapportEquipeDTO(7L, "Équipe technique", synthesePersonnes(),
                        List.of(personne()))));
    }

    private static RapportProjetsDTO projets() {
        return new RapportProjetsDTO("Direction technique", "PRJ", LocalDateTime.now(),
                new SyntheseProjetsDTO(1, 45, 12.5d, 10d, 2.5d, 1, 1, 0, 1, 0, 0, 0, 0,
                        List.of(new TempsParPersonneDTO("Rakoto Jean", 12.5d, 100))),
                List.of(projet()));
    }

    private static RapportProjetDTO projet() {
        return new RapportProjetDTO(
                "Refonte du portail",
                "PRJ-1",
                "Description du projet.",
                "Direction technique",
                "PRJ",
                "Rabe Paul",
                List.of("Rakoto Jean"),
                LocalDateTime.now().minusDays(30),
                LocalDateTime.now().plusDays(30),
                "En cours",
                45,
                LocalDateTime.now(),
                new SyntheseProjetDTO(12.5d, 10d, 2.5d, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0,
                        List.of(new TempsParPersonneDTO("Rakoto Jean", 12.5d, 100))),
                List.of(new TacheRapportDTO("Maquettes", "PRJ-2", StatutTache.EN_COURS,
                        StatutTache.EN_COURS.getLibelle(), "À faire", 45,
                        List.of(new TempsParPersonneDTO("Rakoto Jean", 12.5d, 100)),
                        12.5d, 10d, 2.5d, 1)));
    }

    private static RapportPersonnesDTO personnes() {
        return new RapportPersonnesDTO("Direction technique", "PRJ", LocalDateTime.now(),
                synthesePersonnes(), List.of(personne()));
    }

    private static SynthesePersonnesDTO synthesePersonnes() {
        return new SynthesePersonnesDTO(1, 12.5d, 10d, 2.5d, 1, 1, 0, 1, 0, 0, 0, 0,
                List.of(new TempsParPersonneDTO("Rakoto Jean", 12.5d, 100)));
    }

    private static RapportPersonneDTO personne() {
        return new RapportPersonneDTO(
                "Rakoto Jean", "jrakoto", "jean@example.com",
                12.5d, 10d, 2.5d, 100, 45, 1, 1, 0, 1, 0, 0, 0, 0,
                List.of(new TempsParProjetDTO("PRJ-1", "Refonte du portail", 12.5d, 100)),
                List.of(new TachePersonneDTO("PRJ-2", "Maquettes", "PRJ-1", "Refonte du portail",
                        StatutTache.EN_COURS, StatutTache.EN_COURS.getLibelle(), "À faire",
                        45, 12.5d, 10d, 2.5d, 1, true)));
    }
}
