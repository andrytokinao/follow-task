package com.kinga.followtask.service;

import com.kinga.followtask.dto.Dossier;
import com.kinga.followtask.dto.Fichier;
import com.kinga.followtask.dto.Repertoire;
import com.kinga.utils.KingaUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Gestion des dossiers et des fichiers deposes dans l'arborescence d'une issue.
 */
@Service
@RequiredArgsConstructor
public class DirectoryService {

    /**
     * Cree un sous dossier dans le dossier parent encode.
     */
    public Dossier creerDossier(String encodedParent, String nom) throws IOException {
        Path parent = dossierExistant(encodedParent);
        Path cible = resoudreEnfant(parent, nom);
        Files.createDirectories(cible);
        Dossier dossier = new Dossier(cible.getFileName().toString());
        dossier.setAbsolutePath(cible.toString());
        dossier.setPath(cible.toString());
        dossier.setType("directory");
        return dossier;
    }

    /**
     * Ecrit un fichier dans le dossier encode. Le relativePath, quand il est fourni
     * (upload d'un dossier complet depuis le navigateur), recree l'arborescence d'origine.
     */
    public Repertoire uploadFichier(MultipartFile file, String encodedDirectory, String relativePath) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est vide.");
        }
        Path parent = dossierExistant(encodedDirectory);
        String nomRelatif = StringUtils.hasText(relativePath) ? relativePath : file.getOriginalFilename();
        Path cible = resoudreEnfant(parent, nomRelatif);
        Files.createDirectories(cible.getParent());

        Path fichier = cible.getParent().resolve(nomDisponible(cible.getParent(), cible.getFileName().toString()));
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, fichier);
        }
        return new Fichier(fichier.toString(), fichier.getFileName().toString());
    }

    private Path dossierExistant(String encodedPath) {
        if (!StringUtils.hasText(encodedPath)) {
            throw new IllegalArgumentException("Le dossier parent est obligatoire");
        }
        Path parent = Paths.get(KingaUtils.decodeText(encodedPath)).toAbsolutePath().normalize();
        if (!Files.isDirectory(parent)) {
            throw new IllegalArgumentException("Dossier introuvable : " + parent);
        }
        return parent;
    }

    /**
     * Resout un chemin relatif sous le parent en refusant tout ce qui en sort
     * (chemin absolu, "..").
     */
    private Path resoudreEnfant(Path parent, String relatif) {
        if (!StringUtils.hasText(relatif)) {
            throw new IllegalArgumentException("Le nom est obligatoire");
        }
        Path cible = parent.resolve(relatif.replace('\\', '/')).normalize();
        if (cible.equals(parent) || !cible.startsWith(parent)) {
            throw new IllegalArgumentException("Chemin invalide : " + relatif);
        }
        return cible;
    }

    /**
     * Garde le nom d'origine et suffixe -01, -02... quand le fichier existe deja.
     */
    private String nomDisponible(Path dossier, String nomFichier) {
        String base = nomFichier;
        String extension = "";
        int point = nomFichier.lastIndexOf('.');
        if (point > 0) {
            base = nomFichier.substring(0, point);
            extension = nomFichier.substring(point);
        }
        String candidat = nomFichier;
        int numero = 1;
        while (Files.exists(dossier.resolve(candidat))) {
            candidat = String.format("%s-%02d%s", base, numero++, extension);
        }
        return candidat;
    }
}
