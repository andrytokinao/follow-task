package com.kinga.tasksservice.service;

import com.kinga.followtask.service.GraphiqueService;
import com.kinga.followtask.service.IconeRapportService;
import com.kinga.followtask.service.PdfGenerationService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Aperçu manuel : rasterise le PDF du rapport en images, dans
 * {@code target/apercu}, pour l'examiner à l'œil.
 *
 * <p>Aucune assertion, donc désactivé : ce n'est pas un test mais un outil. Les
 * tests vérifient que le document se met en page et se convertit ; ce qu'ils ne
 * peuvent pas dire, c'est s'il est beau. À activer le temps de retoucher un
 * template ou une icône, en retirant {@code @Disabled}.</p>
 */
@Disabled("Outil d'inspection visuelle, à activer ponctuellement")
class ApercuRapportManuel {

    @Test
    void produireApercu() throws Exception {
        PdfGenerationService service = new PdfGenerationService(
                RapportCompositeRenduTest.moteur(), new GraphiqueService(),
                new IconeRapportService(), "");

        byte[] pdf = service.genererPdfComposite(RapportCompositeRenduTest.rapportComplet());

        Path sortie = Path.of("target", "apercu");
        Files.createDirectories(sortie);
        try (PDDocument document = PDDocument.load(pdf)) {
            PDFRenderer renderer = new PDFRenderer(document);
            int pages = Math.min(document.getNumberOfPages(), 3);
            for (int page = 0; page < pages; page++) {
                ImageIO.write(renderer.renderImageWithDPI(page, 96), "png",
                        new File(sortie.toFile(), "page-" + (page + 1) + ".png"));
            }
            System.out.println("Pages rendues : " + document.getNumberOfPages());
        }
    }
}
