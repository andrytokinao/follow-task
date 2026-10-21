package com.kinga.tasksservice.service;

import com.kinga.followtask.config.WebConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

/**
 * Fichiers statiques du frontend servis par {@link WebConfig}. En prod
 * (21/10/2026), tout /assets repondait 404 : l'emplacement de « /assets/** »
 * etait static/ au lieu de static/assets/. Le service worker, qui exige ces
 * fichiers, ne s'installait plus et l'espace de travail ne s'ouvrait pas.
 *
 * Fichiers de test sous src/test/resources/static : ils ne dependent pas du
 * build Angular.
 */
@SpringJUnitWebConfig(RessourcesStatiquesTest.Config.class)
class RessourcesStatiquesTest {

    @Configuration
    @EnableWebMvc
    @Import(WebConfig.class)
    static class Config {
    }

    @Autowired
    private WebApplicationContext contexte;

    private MockMvc mvc;

    @BeforeEach
    void preparer() {
        mvc = webAppContextSetup(contexte).build();
    }

    @Test
    void unFichierSousAssetsEstServiAvecSonCache() throws Exception {
        mvc.perform(get("/assets/controle/ressource-test.txt"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("ressource de test")))
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("max-age=2592000")));
    }

    @Test
    void unePoliceALaRacineEstServie() throws Exception {
        mvc.perform(get("/police-test.woff2")).andExpect(status().isOk());
    }

    @Test
    void unFichierAbsentRepond404() throws Exception {
        mvc.perform(get("/assets/controle/absent.txt")).andExpect(status().isNotFound());
    }
}
