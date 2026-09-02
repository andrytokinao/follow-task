package com.kinga.followtask.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.TimeUnit;

/**
 * Regles de cache des fichiers statiques du frontend.
 *
 * Le principe : seul un fichier dont le nom porte une empreinte de contenu
 * (main.a1b2c3.js) peut etre declare immuable, puisqu'un changement de contenu
 * change son nom. Un fichier au nom stable doit etre revalide a chaque visite,
 * sinon le navigateur garde eternellement l'ancienne version.
 *
 * La configuration precedente appliquait "max-age=1 an, immutable" a /** :
 * index.html, ngsw.json et l'ensemble des bundles etaient donc figes dans le
 * navigateur pour un an. Apres un deploiement, l'onglet continuait de servir
 * l'ancien index.html et l'ancien main.js depuis le cache HTTP, pendant que le
 * service worker tentait d'installer la nouvelle version : les chunks
 * differes charges a la navigation (celui de /working, juste apres la
 * connexion) ne provenaient plus de la meme compilation que le bundle en
 * memoire, l'import echouait, le routeur abandonnait la navigation et l'ecran
 * restait blanc.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final String STATIC = "classpath:/static/";

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // Point d'entree de l'application et fichiers du service worker : leur
        // nom ne change jamais, ils doivent etre revalides systematiquement.
        // C'est ce qui permet a une nouvelle version d'etre vue.
        registry.addResourceHandler(
                        "/",
                        "/index.html",
                        "/ngsw.json",
                        "/ngsw-worker.js",
                        "/safety-worker.js",
                        "/worker-basic.min.js",
                        "/manifest.webmanifest")
                .addResourceLocations(STATIC)
                .setCacheControl(CacheControl.noCache().mustRevalidate());

        // Fichiers a empreinte produits par `ng build` en configuration
        // production (outputHashing) : nom.<empreinte>.js / .css. Deux points
        // dans le nom, ce que main.js n'a pas — un build de developpement ne
        // tombe donc jamais ici par accident.
        registry.addResourceHandler("/*.*.js", "/*.*.css")
                .addResourceLocations(STATIC)
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).immutable());

        // Ressources statiques au nom stable : on les cache, mais sans
        // "immutable", pour qu'un remplacement soit repris apres expiration.
        registry.addResourceHandler("/assets/**", "/*.woff2", "/*.woff", "/*.ttf", "/*.eot")
                .addResourceLocations(STATIC)
                .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic());

        // Tout le reste, y compris un build sans empreinte : revalidation.
        registry.addResourceHandler("/**")
                .addResourceLocations(STATIC)
                .setCacheControl(CacheControl.noCache().mustRevalidate());
    }
}
