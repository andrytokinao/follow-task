package com.kinga.tasksservice.service;

import com.kinga.followtask.entity.enumapp.TypeOutil;
import com.kinga.followtask.service.outil.FichierOutilService;
import com.kinga.followtask.service.outil.PolitiqueFichiersOutil;
import com.kinga.followtask.service.outil.StockageFichiersOutil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Menu Outils (DT-019) : fichiers acceptes, nom affiche, stockage sur le disque. */
class FichiersOutilTest {

    private final PolitiqueFichiersOutil politique = new PolitiqueFichiersOutil(
            "exe,msi,zip", "docx,pdf", "mp4", "pdf", 10, 1, 10, 1);

    @TempDir
    Path dossier;

    @Test
    void unModeleWordEstAccepte() {
        assertThat(politique.verifier(TypeOutil.MODELE_DOCUMENT, "modele-rapport-par.DOCX", 2048)).isEqualTo("docx");
    }

    @Test
    void uneExtensionNonPermiseEstRefusee() {
        assertThatThrownBy(() -> politique.verifier(TypeOutil.MODELE_DOCUMENT, "script.html", 10))
                .hasMessageContaining("docx");
        assertThatThrownBy(() -> politique.verifier(TypeOutil.MODELE_DOCUMENT, "sans-extension", 10))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void unFichierTropLourdOuVideEstRefuse() {
        assertThatThrownBy(() -> politique.verifier(TypeOutil.MODELE_DOCUMENT, "gros.pdf", 2L * 1024 * 1024))
                .hasMessageContaining("1 Mo");
        assertThatThrownBy(() -> politique.verifier(TypeOutil.MODELE_DOCUMENT, "vide.pdf", 0))
                .hasMessageContaining("vide");
    }

    @Test
    void leNomAfficheNeGardeQueLeDernierSegment() {
        assertThat(FichierOutilService.nomAffichable("C:\\Users\\moi\\modele-rapport-par.docx")).isEqualTo("modele-rapport-par.docx");
        assertThat(FichierOutilService.nomAffichable("../../etc/passwd")).isEqualTo("passwd");
        assertThatThrownBy(() -> FichierOutilService.nomAffichable("dossier/")).hasMessageContaining("nom");
    }

    @Test
    void leFichierEstEcritSousUnNomGenereDansLeDossierDeLOutil() throws Exception {
        StockageFichiersOutil stockage = new StockageFichiersOutil(dossier.toString());

        String nom = stockage.ecrire(7L, new MockMultipartFile("file", "modele.docx", null, new byte[]{1, 2, 3}), "docx");

        assertThat(nom).endsWith(".docx").doesNotContain("modele");
        assertThat(Files.readAllBytes(dossier.resolve("7").resolve(nom))).containsExactly(1, 2, 3);
    }

    @Test
    void aucunCheminNeSortDuDossierDesOutils() {
        StockageFichiersOutil stockage = new StockageFichiersOutil(dossier.toString());

        assertThatThrownBy(() -> stockage.chemin(7L, "../8/autre.docx")).hasMessageContaining("refusé");
        assertThatThrownBy(() -> stockage.chemin(7L, "../../secret.txt")).hasMessageContaining("refusé");
    }
}
