package com.kinga.tasksservice.service;

import com.kinga.followtask.dto.MetaUpload;
import com.kinga.followtask.entity.Uploaded;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.UploadedRepository;
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

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Fichiers a plat (DT-018) : auteur et date des uploads sous un dossier, lus
 * en une requete sans entites, sur une vraie base (H2 en mode MySQL). Valide
 * aussi sa syntaxe : une requete refusee par Hibernate empecherait
 * l'application de demarrer.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
        "spring.liquibase.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.url=jdbc:h2:mem:uploads;MODE=MySQL;DATABASE_TO_LOWER=TRUE",
        "spring.sql.init.mode=never",
        "spring.jpa.properties.hibernate.hbm2ddl.schema_filter_provider=org.hibernate.tool.schema.internal.DefaultSchemaFilterProvider"
})
class RequetesUploadedTest {

    /** Seul le depot des uploads : les autres ne concernent pas ce test. */
    @Configuration
    @EntityScan("com.kinga.followtask.entity")
    @EnableJpaRepositories(basePackageClasses = UploadedRepository.class, includeFilters = @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE, classes = UploadedRepository.class))
    static class Config {
    }

    @Autowired
    private EntityManager em;
    @Autowired
    private UploadedRepository uploads;

    @BeforeEach
    void preparer() {
        UserApp auteur = new UserApp();
        auteur.setId("jean");
        auteur.setUsername("jean");
        auteur.setFirstName("Jean");
        auteur.setLastName("Rabe");
        auteur.setPhoto("jean.png");
        em.persist(auteur);
        upload("/projets/BATI-1/devis.pdf", auteur);
        upload("/projets/BATI-1/PLAN-19/plan.dwg", auteur);
        // Sans auteur connu : la ligne vient quand meme, auteur vide.
        upload("/projets/BATI-1/PLAN-19/notes.docx", null);
        upload("/projets/BATI-2/autre.pdf", auteur);
        em.flush();
        em.clear();
    }

    @Test
    void lesUploadsSousUnDossierAvecLeurAuteurDansLOrdreDEnregistrement() {
        assertThat(uploads.metadonneesSous("/projets/BATI-1"))
                .extracting(MetaUpload::path, MetaUpload::firstName, MetaUpload::photo)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("/projets/BATI-1/devis.pdf", "Jean", "jean.png"),
                        org.assertj.core.groups.Tuple.tuple("/projets/BATI-1/PLAN-19/plan.dwg", "Jean", "jean.png"),
                        org.assertj.core.groups.Tuple.tuple("/projets/BATI-1/PLAN-19/notes.docx", null, null));
    }

    @Test
    void laDateEstRendue() {
        assertThat(uploads.metadonneesSous("/projets/BATI-2"))
                .singleElement()
                .satisfies(meta -> assertThat(meta.uploadDate()).isNotNull());
    }

    private void upload(String chemin, UserApp auteur) {
        Uploaded uploaded = new Uploaded(chemin.substring(chemin.lastIndexOf('/') + 1), chemin);
        uploaded.setUserApp(auteur);
        uploaded.setUploadDate(LocalDateTime.now());
        em.persist(uploaded);
    }
}
