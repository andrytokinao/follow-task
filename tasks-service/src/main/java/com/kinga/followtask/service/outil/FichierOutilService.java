package com.kinga.followtask.service.outil;

import com.kinga.followtask.dto.outil.FichierOutilVue;
import com.kinga.followtask.entity.FichierOutil;
import com.kinga.followtask.entity.Outil;
import com.kinga.followtask.repository.FichierOutilRepository;
import com.kinga.followtask.repository.OutilRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;

/**
 * Fichiers des outils (DT-019) : ajout, telechargement, suppression.
 *
 * <ul>
 *   <li>Ajouter : quiconque voit l'outil.</li>
 *   <li>Supprimer : celui qui a ajoute le fichier, l'auteur de l'outil ou
 *   l'administrateur. Suppression logique : le fichier reste sur le disque,
 *   et peut etre restaure.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class FichierOutilService {

    private final FichierOutilRepository fichierRepository;
    private final OutilRepository outilRepository;
    private final AccesOutilService acces;
    private final DroitsOutil droits;
    private final PolitiqueFichiersOutil politique;
    private final StockageFichiersOutil stockage;
    private final VuesOutil vues;

    /** Fichier pret a envoyer au navigateur. */
    public record Telechargement(Path chemin, String nom, MediaType type) {
    }

    /**
     * Ecrit le fichier puis l'enregistre en base. Si la base refuse, le
     * fichier ecrit est efface : ni fichier orphelin sur le disque, ni ligne
     * qui pointe vers un fichier absent.
     */
    @Transactional
    public FichierOutilVue deposer(Long outilId, MultipartFile envoi) {
        Outil outil = outilActif(outilId);
        ContexteOutil contexte = acces.pourElement(outil);
        String nom = nomAffichable(envoi.getOriginalFilename());
        String extension = politique.verifier(outil.getTypeOutil(), nom, envoi.getSize());
        String nomStockage = stockage.ecrire(outil.getId(), envoi, extension);
        try {
            FichierOutil fichier = new FichierOutil();
            fichier.setOutil(outil);
            fichier.setNomOrigine(nom);
            fichier.setNomStockage(nomStockage);
            fichier.setTypeMime(typeMime(nom).toString());
            fichier.setTaille(envoi.getSize());
            fichier.setAuteur(contexte.utilisateur());
            fichier.setDateAjout(LocalDateTime.now());
            return vues.fichier(fichierRepository.saveAndFlush(fichier), contexte);
        } catch (RuntimeException e) {
            stockage.supprimer(outil.getId(), nomStockage);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public Telechargement telecharger(Long fichierId) {
        FichierOutil fichier = fichierActif(fichierId);
        Outil outil = outilActif(fichier.getOutil().getId());
        acces.pourElement(outil);
        Path chemin = stockage.chemin(outil.getId(), fichier.getNomStockage());
        if (!Files.isReadable(chemin)) {
            throw new IllegalStateException("Le fichier « " + fichier.getNomOrigine() + " » est introuvable sur le serveur");
        }
        return new Telechargement(chemin, fichier.getNomOrigine(), typeMime(fichier.getNomOrigine()));
    }

    @Transactional
    public void supprimer(ContexteOutil contexte, Long fichierId) {
        FichierOutil fichier = fichierActif(fichierId);
        acces.verifierVisible(fichier.getOutil(), contexte);
        if (!droits.peutSupprimerFichier(fichier, contexte)) {
            throw new AccessDeniedException("Seuls celui qui a ajouté ce fichier, l'auteur de l'outil et l'administrateur peuvent le supprimer");
        }
        fichier.setDeleted(true);
        fichierRepository.save(fichier);
    }

    private Outil outilActif(Long outilId) {
        return outilRepository.findById(outilId)
                .filter(o -> !Boolean.TRUE.equals(o.getDeleted()))
                .orElseThrow(() -> new IllegalArgumentException("Outil introuvable : " + outilId));
    }

    private FichierOutil fichierActif(Long fichierId) {
        return fichierRepository.findById(fichierId)
                .filter(f -> !Boolean.TRUE.equals(f.getDeleted()))
                .orElseThrow(() -> new IllegalArgumentException("Fichier introuvable : " + fichierId));
    }

    /** Dernier segment du nom envoye (certains navigateurs envoient le chemin complet), sans caracteres de controle. */
    public static String nomAffichable(String nomEnvoye) {
        String nom = nomEnvoye == null ? "" : nomEnvoye.replace('\\', '/');
        nom = nom.substring(nom.lastIndexOf('/') + 1).replaceAll("\\p{Cntrl}", "").trim();
        if (nom.isEmpty()) {
            throw new IllegalArgumentException("Le fichier n'a pas de nom");
        }
        if (nom.length() > FichierOutil.NOM_MAX) {
            int point = nom.lastIndexOf('.');
            String extension = point < 0 ? "" : nom.substring(point);
            nom = nom.substring(0, FichierOutil.NOM_MAX - extension.length()) + extension;
        }
        return nom;
    }

    /** Deduit du nom, pas du navigateur : l'en-tete envoye ne prouve rien. */
    private static MediaType typeMime(String nom) {
        return MediaTypeFactory.getMediaType(nom).orElse(MediaType.APPLICATION_OCTET_STREAM);
    }
}
