package com.kinga.followtask.service;

import com.kinga.followtask.config.CurrentUserProvider;
import com.kinga.followtask.dto.Dossier;
import com.kinga.followtask.dto.Fichier;
import com.kinga.followtask.dto.Repertoire;
import com.kinga.followtask.entity.Uploaded;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.UploadedRepository;
import com.kinga.utils.KingaUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.kinga.utils.KingaUtils.dateTimeFormater;

/**
 * Gestion des dossiers et des fichiers deposes dans l'arborescence d'une issue.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DirectoryService {

    private final UploadedRepository uploadedRepository;
    private final CurrentUserProvider currentUserProvider;

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

        Uploaded uploaded = tracer(fichier);
        Fichier resultat = new Fichier(fichier.toString(), fichier.getFileName().toString());
        appliquer(resultat, uploaded);
        return resultat;
    }

    /**
     * Enregistre qui a depose le fichier et quand. L'echec de la trace ne doit
     * pas annuler un upload deja ecrit sur le disque.
     */
    private Uploaded tracer(Path fichier) {
        try {
            Uploaded uploaded = new Uploaded(fichier.getFileName().toString(), fichier.toString());
            uploaded.setUserApp(currentUserProvider.getCurrentUser());
            uploaded.setUploadDate(LocalDateTime.now());
            return uploadedRepository.save(uploaded);
        } catch (Exception e) {
            log.warn("Trace de l'upload impossible pour {} : {}", fichier, e.getMessage());
            return null;
        }
    }

    /**
     * Renseigne auteur et date d'upload sur une arborescence deja construite,
     * a partir des lignes enregistrees sous la racine.
     */
    public void appliquerMetadonnees(Repertoire racine) {
        if (racine == null || !StringUtils.hasText(racine.getAbsolutePath())) {
            return;
        }
        String base = KingaUtils.decodeText(racine.getAbsolutePath());
        Map<String, Uploaded> parChemin = new HashMap<>();
        for (Uploaded uploaded : uploadedRepository.findByPathStartingWith(base)) {
            // Le dernier enregistre gagne : un fichier remplace garde son auteur courant.
            parChemin.put(uploaded.getPath(), uploaded);
        }
        if (parChemin.isEmpty()) {
            return;
        }
        enrichir(racine, parChemin);
    }

    private void enrichir(Repertoire noeud, Map<String, Uploaded> parChemin) {
        appliquer(noeud, parChemin.get(KingaUtils.decodeText(noeud.getAbsolutePath())));
        if (noeud instanceof Dossier dossier) {
            List<Repertoire> enfants = dossier.getRepertoires();
            if (enfants != null) {
                enfants.forEach(enfant -> enrichir(enfant, parChemin));
            }
        }
    }

    private void appliquer(Repertoire noeud, Uploaded uploaded) {
        if (uploaded == null) {
            return;
        }
        noeud.setUploadeur(nomAffiche(uploaded.getUserApp()));
        if (uploaded.getUploadDate() != null) {
            noeud.setDateUpload(dateTimeFormater.format(uploaded.getUploadDate()));
        }
    }

    private String nomAffiche(UserApp user) {
        if (user == null) {
            return null;
        }
        String complet = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return complet.isEmpty() ? user.getUsername() : complet;
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
