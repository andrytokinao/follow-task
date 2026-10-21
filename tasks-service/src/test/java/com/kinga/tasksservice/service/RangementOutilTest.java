package com.kinga.tasksservice.service;

import com.kinga.followtask.entity.DossierOutil;
import com.kinga.followtask.entity.Outil;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.enumapp.PorteeOutil;
import com.kinga.followtask.entity.enumapp.TypeOutil;
import com.kinga.followtask.service.outil.RangementOutil;
import com.kinga.followtask.service.outil.ValidationOutil;
import org.junit.jupiter.api.Test;

import static com.kinga.followtask.entity.enumapp.PorteeOutil.ESPACE;
import static com.kinga.followtask.entity.enumapp.PorteeOutil.TOUS_LES_ESPACES;
import static com.kinga.followtask.entity.enumapp.TypeOutil.LOGICIEL;
import static com.kinga.followtask.entity.enumapp.TypeOutil.MODELE_DOCUMENT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Menu Outils (DT-019) : ou ranger un dossier ou un outil, et saisies. */
class RangementOutilTest {

    private final RangementOutil rangement = new RangementOutil();
    private final ValidationOutil validation = new ValidationOutil();

    private final Project espaceA = espace(1L);
    private final Project espaceB = espace(2L);

    @Test
    void laRacineDuTypeAccepteTout() {
        assertThatCode(() -> rangement.verifier(LOGICIEL, outil(LOGICIEL, TOUS_LES_ESPACES, null), null))
                .doesNotThrowAnyException();
    }

    @Test
    void unOutilNeVaPasDansUnDossierDUnAutreType() {
        DossierOutil modeles = dossier(10L, MODELE_DOCUMENT, TOUS_LES_ESPACES, null, null);

        assertThatThrownBy(() -> rangement.verifier(LOGICIEL, outil(LOGICIEL, ESPACE, espaceA), modeles))
                .hasMessageContaining("même type");
    }

    @Test
    void unDossierPartageRecoitLesOutilsDesEspaces() {
        DossierOutil partage = dossier(10L, LOGICIEL, TOUS_LES_ESPACES, null, null);

        assertThatCode(() -> rangement.verifier(LOGICIEL, outil(LOGICIEL, ESPACE, espaceA), partage))
                .doesNotThrowAnyException();
    }

    @Test
    void unOutilPartageNeVaPasDansLeDossierDUnEspace() {
        DossierOutil deA = dossier(10L, LOGICIEL, ESPACE, espaceA, null);

        assertThatThrownBy(() -> rangement.verifier(LOGICIEL, outil(LOGICIEL, TOUS_LES_ESPACES, null), deA))
                .hasMessageContaining("réservé");
    }

    @Test
    void unOutilNeVaPasDansLeDossierDUnAutreEspace() {
        DossierOutil deA = dossier(10L, LOGICIEL, ESPACE, espaceA, null);

        assertThatThrownBy(() -> rangement.verifier(LOGICIEL, outil(LOGICIEL, ESPACE, espaceB), deA))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deuxNiveauxDeDossiersAuPlus() {
        DossierOutil niveau1 = dossier(10L, LOGICIEL, TOUS_LES_ESPACES, null, null);
        DossierOutil niveau2 = dossier(11L, LOGICIEL, TOUS_LES_ESPACES, null, niveau1);

        assertThatCode(() -> rangement.verifierParent(dossier(null, LOGICIEL, ESPACE, espaceA, null), niveau1))
                .doesNotThrowAnyException();
        assertThatThrownBy(() -> rangement.verifierParent(dossier(null, LOGICIEL, ESPACE, espaceA, null), niveau2))
                .hasMessageContaining("niveaux");
        assertThat(rangement.profondeur(niveau2)).isEqualTo(2);
    }

    @Test
    void unLienDoitEtreWeb() {
        assertThat(validation.lien(" https://exemple.mg/outil ", true, 2000)).isEqualTo("https://exemple.mg/outil");
        assertThatThrownBy(() -> validation.lien("javascript:alert(1)", true, 2000)).hasMessageContaining("http");
        assertThatThrownBy(() -> validation.lien("file:///C:/secret", false, 2000)).hasMessageContaining("http");
        assertThat(validation.lien("  ", false, 2000)).isNull();
    }

    @Test
    void unNomEstNettoyeEtBorne() {
        assertThat(validation.libelle("  Bureautique\n  2026 ", "Le nom", 120)).isEqualTo("Bureautique 2026");
        assertThatThrownBy(() -> validation.libelle("   ", "Le nom", 120)).hasMessageContaining("obligatoire");
        assertThatThrownBy(() -> validation.libelle("x".repeat(121), "Le nom", 120)).hasMessageContaining("120");
    }

    private static DossierOutil dossier(Long id, TypeOutil type, PorteeOutil portee, Project espace, DossierOutil parent) {
        DossierOutil dossier = new DossierOutil();
        dossier.setId(id);
        dossier.setNom("Dossier " + id);
        dossier.setTypeOutil(type);
        dossier.setPortee(portee);
        dossier.setProject(espace);
        dossier.setParent(parent);
        return dossier;
    }

    private static Outil outil(TypeOutil type, PorteeOutil portee, Project espace) {
        Outil outil = new Outil();
        outil.setTypeOutil(type);
        outil.setPortee(portee);
        outil.setProject(espace);
        return outil;
    }

    private static Project espace(Long id) {
        Project project = new Project();
        project.setId(id);
        return project;
    }
}
