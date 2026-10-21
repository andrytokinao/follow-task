package com.kinga.tasksservice.service;

import com.kinga.followtask.entity.DossierOutil;
import com.kinga.followtask.entity.Outil;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.PorteeOutil;
import com.kinga.followtask.entity.enumapp.TypeOutil;
import com.kinga.followtask.repository.DossierOutilRepository;
import com.kinga.followtask.repository.FichierOutilRepository;
import com.kinga.followtask.repository.OutilRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Menu Outils (DT-019) : les requetes de visibilite, sur une vraie base (H2
 * en mode MySQL). Valide aussi leur syntaxe : une requete refusee par
 * Hibernate empecherait l'application de demarrer.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
        "spring.liquibase.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.url=jdbc:h2:mem:outils;MODE=MySQL;DATABASE_TO_LOWER=TRUE",
        "spring.sql.init.mode=never",
        "spring.jpa.properties.hibernate.hbm2ddl.schema_filter_provider=org.hibernate.tool.schema.internal.DefaultSchemaFilterProvider"
})
class RequetesOutilTest {

    /** Seuls les depots des outils : les autres ne concernent pas ce test. */
    @Configuration
    @EntityScan("com.kinga.followtask.entity")
    @EnableJpaRepositories(basePackageClasses = OutilRepository.class, includeFilters = @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = {DossierOutilRepository.class, OutilRepository.class, FichierOutilRepository.class}))
    static class Config {
    }

    @Autowired
    private EntityManager em;
    @Autowired
    private DossierOutilRepository dossiers;
    @Autowired
    private OutilRepository outils;
    @Autowired
    private FichierOutilRepository fichiers;

    private UserApp auteur;
    private Project espaceA;
    private Project espaceB;
    private DossierOutil partage;
    private DossierOutil deA;

    @BeforeEach
    void preparer() {
        auteur = new UserApp();
        auteur.setId("auteur");
        auteur.setUsername("auteur");
        em.persist(auteur);
        espaceA = espace("A");
        espaceB = espace("B");
        partage = dossier("Partagé", PorteeOutil.TOUS_LES_ESPACES, null, null);
        deA = dossier("De A", PorteeOutil.ESPACE, espaceA, null);
        dossier("Sous-dossier de A", PorteeOutil.ESPACE, espaceA, partage);
        outil("Antivirus", PorteeOutil.TOUS_LES_ESPACES, null, null);
        outil("VPN", PorteeOutil.ESPACE, espaceA, partage);
        // Incoherent (B range chez A) : B doit tout de meme le voir, a la racine.
        outil("Egaré", PorteeOutil.ESPACE, espaceB, deA);
        em.flush();
        em.clear();
    }

    @Test
    void chaqueEspaceVoitLesDossiersPartagesEtLesSiens() {
        assertThat(dossiers.sousDossiersVisibles(espaceA.getId(), TypeOutil.LOGICIEL, null))
                .extracting(DossierOutil::getNom).containsExactly("De A", "Partagé");
        assertThat(dossiers.sousDossiersVisibles(espaceB.getId(), TypeOutil.LOGICIEL, null))
                .extracting(DossierOutil::getNom).containsExactly("Partagé");
        assertThat(dossiers.sousDossiersVisibles(espaceA.getId(), TypeOutil.LOGICIEL, partage.getId()))
                .extracting(DossierOutil::getNom).containsExactly("Sous-dossier de A");
        assertThat(dossiers.sousDossiersVisibles(espaceB.getId(), TypeOutil.LOGICIEL, partage.getId())).isEmpty();
        assertThat(dossiers.sousDossiersVisibles(espaceA.getId(), TypeOutil.LIEN, null)).isEmpty();
    }

    @Test
    void unOutilDontLeDossierEstInvisibleSAfficheALaRacine() {
        assertThat(outils.visiblesALaRacine(espaceA.getId(), TypeOutil.LOGICIEL))
                .extracting(Outil::getTitre).containsExactly("Antivirus");
        assertThat(outils.visiblesALaRacine(espaceB.getId(), TypeOutil.LOGICIEL))
                .extracting(Outil::getTitre).containsExactly("Antivirus", "Egaré");
    }

    @Test
    void lesOutilsDUnDossierSontFiltresParEspace() {
        assertThat(outils.visiblesDansDossier(espaceA.getId(), TypeOutil.LOGICIEL, partage.getId()))
                .extracting(Outil::getTitre).containsExactly("VPN");
        assertThat(outils.visiblesDansDossier(espaceB.getId(), TypeOutil.LOGICIEL, partage.getId())).isEmpty();
    }

    @Test
    void laRechercheCouvreTitreEtDescriptionSansLaCasse() {
        assertThat(outils.rechercher(espaceB.getId(), "ANTI")).extracting(Outil::getTitre).containsExactly("Antivirus");
        assertThat(outils.rechercher(espaceB.getId(), "installer")).extracting(Outil::getTitre)
                .containsExactly("Antivirus", "Egaré");
    }

    @Test
    void homonymesEtContenuDesDossiers() {
        assertThat(dossiers.homonymes(TypeOutil.LOGICIEL, null, "PARTAGÉ")).hasSize(1);
        assertThat(dossiers.homonymes(TypeOutil.LOGICIEL, partage.getId(), "partagé")).isEmpty();
        assertThat(outils.existsByDossierIdAndDeletedFalse(partage.getId())).isTrue();
        assertThat(dossiers.existsByParentIdAndDeletedFalse(partage.getId())).isTrue();
        assertThat(dossiers.existsByParentIdAndDeletedFalse(deA.getId())).isFalse();
        assertThat(fichiers.findByOutilIdInAndDeletedFalseOrderByDateAjoutAsc(List.of(1L, 2L))).isEmpty();
    }

    private Project espace(String nom) {
        Project espace = new Project();
        espace.setName(nom);
        espace.setPrefix(nom);
        em.persist(espace);
        return espace;
    }

    private DossierOutil dossier(String nom, PorteeOutil portee, Project espace, DossierOutil parent) {
        DossierOutil dossier = new DossierOutil();
        dossier.setNom(nom);
        dossier.setTypeOutil(TypeOutil.LOGICIEL);
        dossier.setPortee(portee);
        dossier.setProject(espace);
        dossier.setParent(parent);
        dossier.setAuteur(auteur);
        dossier.setDateCreation(LocalDateTime.now());
        em.persist(dossier);
        return dossier;
    }

    private void outil(String titre, PorteeOutil portee, Project espace, DossierOutil dossier) {
        Outil outil = new Outil();
        outil.setTitre(titre);
        outil.setDescription(titre.equals("VPN") ? "Accès distant" : "Comment l'installer");
        outil.setTypeOutil(TypeOutil.LOGICIEL);
        outil.setPortee(portee);
        outil.setProject(espace);
        outil.setDossier(dossier);
        outil.setAuteur(auteur);
        outil.setDateCreation(LocalDateTime.now());
        em.persist(outil);
    }
}
