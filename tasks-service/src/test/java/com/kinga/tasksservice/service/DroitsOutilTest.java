package com.kinga.tasksservice.service;

import com.kinga.followtask.entity.FichierOutil;
import com.kinga.followtask.entity.Outil;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.PorteeOutil;
import com.kinga.followtask.service.outil.ContexteOutil;
import com.kinga.followtask.service.outil.DroitsOutil;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Menu Outils (DT-019) : qui voit, qui modifie, qui supprime un fichier. */
class DroitsOutilTest {

    private final DroitsOutil droits = new DroitsOutil();

    private final Project espaceA = espace(1L);
    private final Project espaceB = espace(2L);
    private final UserApp auteur = utilisateur("auteur");
    private final UserApp autre = utilisateur("autre");

    @Test
    void partageVisibleDepuisTousLesEspaces() {
        Outil outil = outil(PorteeOutil.TOUS_LES_ESPACES, null, auteur);

        assertThat(droits.visibleDepuis(outil, 1L)).isTrue();
        assertThat(droits.visibleDepuis(outil, 2L)).isTrue();
    }

    @Test
    void outilDEspaceVisibleSeulementDansSonEspace() {
        Outil outil = outil(PorteeOutil.ESPACE, espaceA, auteur);

        assertThat(droits.visibleDepuis(outil, 1L)).isTrue();
        assertThat(droits.visibleDepuis(outil, 2L)).isFalse();
    }

    @Test
    void lAuteurModifieSonOutil() {
        assertThat(droits.peutModifier(outil(PorteeOutil.TOUS_LES_ESPACES, null, auteur),
                contexte(auteur, espaceB, false, false))).isTrue();
    }

    @Test
    void unSimpleMembreNeModifiePasLOutilDUnAutre() {
        assertThat(droits.peutModifier(outil(PorteeOutil.ESPACE, espaceA, auteur),
                contexte(autre, espaceA, false, false))).isFalse();
    }

    @Test
    void lAdminDeLEspaceModifieLesOutilsDeSonEspace() {
        assertThat(droits.peutModifier(outil(PorteeOutil.ESPACE, espaceA, auteur),
                contexte(autre, espaceA, false, true))).isTrue();
    }

    @Test
    void lAdminDUnEspaceNeTouchePasAuxOutilsPartages() {
        assertThat(droits.peutModifier(outil(PorteeOutil.TOUS_LES_ESPACES, null, auteur),
                contexte(autre, espaceA, false, true))).isFalse();
    }

    @Test
    void lAdminDUnEspaceNeTouchePasAuxOutilsDUnAutreEspace() {
        assertThat(droits.peutModifier(outil(PorteeOutil.ESPACE, espaceB, auteur),
                contexte(autre, espaceA, false, true))).isFalse();
    }

    @Test
    void lAdminSystemeModifieTout() {
        assertThat(droits.peutModifier(outil(PorteeOutil.TOUS_LES_ESPACES, null, auteur),
                contexte(autre, espaceA, true, false))).isTrue();
    }

    @Test
    void celuiQuiAAjouteUnFichierPeutLeSupprimer() {
        FichierOutil fichier = fichier(outil(PorteeOutil.ESPACE, espaceA, auteur), autre);

        assertThat(droits.peutSupprimerFichier(fichier, contexte(autre, espaceA, false, false))).isTrue();
    }

    @Test
    void lAuteurDeLOutilPeutSupprimerSesFichiers() {
        UserApp tiers = utilisateur("tiers");
        FichierOutil fichier = fichier(outil(PorteeOutil.ESPACE, espaceA, auteur), tiers);

        assertThat(droits.peutSupprimerFichier(fichier, contexte(auteur, espaceA, false, false))).isTrue();
    }

    @Test
    void unAutreMembreNeSupprimePasLeFichierDUnAutre() {
        FichierOutil fichier = fichier(outil(PorteeOutil.ESPACE, espaceA, auteur), auteur);

        assertThat(droits.peutSupprimerFichier(fichier, contexte(autre, espaceA, false, false))).isFalse();
    }

    private static ContexteOutil contexte(UserApp qui, Project espace, boolean adminSysteme, boolean adminEspace) {
        return new ContexteOutil(qui, espace, adminSysteme, adminEspace);
    }

    private static Outil outil(PorteeOutil portee, Project espace, UserApp auteur) {
        Outil outil = new Outil();
        outil.setPortee(portee);
        outil.setProject(espace);
        outil.setAuteur(auteur);
        return outil;
    }

    private static FichierOutil fichier(Outil outil, UserApp auteur) {
        FichierOutil fichier = new FichierOutil();
        fichier.setOutil(outil);
        fichier.setAuteur(auteur);
        return fichier;
    }

    private static Project espace(Long id) {
        Project project = new Project();
        project.setId(id);
        return project;
    }

    private static UserApp utilisateur(String id) {
        UserApp user = new UserApp();
        user.setId(id);
        return user;
    }
}
