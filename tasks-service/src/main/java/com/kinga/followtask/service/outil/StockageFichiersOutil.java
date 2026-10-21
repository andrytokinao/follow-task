package com.kinga.followtask.service.outil;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Fichiers des outils sur le disque (DT-019) :
 * {@code <app.storage.base-path>/outils/<id de l'outil>/<uuid>.<extension>}.
 *
 * <p>Un dossier a part de ceux des espaces : un outil partage n'appartient a
 * aucun espace. Le nom sur le disque est genere ; le nom envoye par le
 * navigateur n'entre jamais dans un chemin.</p>
 */
@Slf4j
@Component
public class StockageFichiersOutil {

    private final Path racine;

    public StockageFichiersOutil(@Value("${outils.fichiers.dossier:${app.storage.base-path:${user.home}}/outils}") String dossier) {
        this.racine = Paths.get(dossier).toAbsolutePath().normalize();
    }

    /** Ecrit le fichier et rend son nom de stockage. */
    public String ecrire(Long outilId, MultipartFile fichier, String extension) {
        String nomStockage = UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);
        Path cible = chemin(outilId, nomStockage);
        try (InputStream contenu = fichier.getInputStream()) {
            Files.createDirectories(cible.getParent());
            Files.copy(contenu, cible, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            supprimer(outilId, nomStockage);
            throw new UncheckedIOException("Enregistrement du fichier impossible", e);
        }
        return nomStockage;
    }

    /** Chemin d'un fichier ; refuse tout ce qui sortirait du dossier des outils. */
    public Path chemin(Long outilId, String nomStockage) {
        Path chemin = racine.resolve(String.valueOf(outilId)).resolve(nomStockage).normalize();
        if (!chemin.startsWith(racine) || !chemin.getParent().getFileName().toString().equals(String.valueOf(outilId))) {
            throw new IllegalArgumentException("Chemin de fichier refusé");
        }
        return chemin;
    }

    /** Annule une ecriture ; sans effet si le fichier n'existe pas. */
    public void supprimer(Long outilId, String nomStockage) {
        try {
            Files.deleteIfExists(chemin(outilId, nomStockage));
        } catch (IOException | IllegalArgumentException e) {
            log.warn("Fichier d'outil non supprime : {}/{}", outilId, nomStockage, e);
        }
    }
}
