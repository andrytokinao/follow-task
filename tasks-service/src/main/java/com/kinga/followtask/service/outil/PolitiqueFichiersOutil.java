package com.kinga.followtask.service.outil;

import com.kinga.followtask.entity.enumapp.TypeOutil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.EnumMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Fichiers acceptes par type d'outil (DT-019) : extensions permises et taille
 * maximale. Valeurs par defaut ci-dessous, reglables sans livraison dans
 * {@code application.properties} ({@code outils.fichiers.*}).
 */
@Component
public class PolitiqueFichiersOutil {

    private static final long MO = 1024L * 1024L;

    private final Map<TypeOutil, Set<String>> extensions = new EnumMap<>(TypeOutil.class);
    private final Map<TypeOutil, Long> taillesMax = new EnumMap<>(TypeOutil.class);

    public PolitiqueFichiersOutil(
            @Value("${outils.fichiers.extensions.logiciel:exe,msi,zip,7z,rar,gz,tgz,tar,dmg,pkg,deb,rpm,apk,jar,iso,pdf,txt}") String logiciel,
            @Value("${outils.fichiers.extensions.modele-document:doc,docx,dot,dotx,xls,xlsx,xlt,xltx,ppt,pptx,pot,potx,odt,ods,odp,ott,pdf,txt,csv,rtf,md,png,jpg,jpeg,vsd,vsdx}") String modele,
            @Value("${outils.fichiers.extensions.tutoriel-video:mp4,webm,ogv,mov,mkv,avi,m4v,mp3,pdf,ppt,pptx}") String video,
            @Value("${outils.fichiers.extensions.lien:pdf,png,jpg,jpeg,txt}") String lien,
            @Value("${outils.fichiers.taille-max-mo.logiciel:1024}") long tailleLogiciel,
            @Value("${outils.fichiers.taille-max-mo.modele-document:50}") long tailleModele,
            @Value("${outils.fichiers.taille-max-mo.tutoriel-video:1024}") long tailleVideo,
            @Value("${outils.fichiers.taille-max-mo.lien:20}") long tailleLien) {
        definir(TypeOutil.LOGICIEL, logiciel, tailleLogiciel);
        definir(TypeOutil.MODELE_DOCUMENT, modele, tailleModele);
        definir(TypeOutil.TUTORIEL_VIDEO, video, tailleVideo);
        definir(TypeOutil.LIEN, lien, tailleLien);
    }

    /** Refuse un fichier vide, trop lourd, ou d'une extension non permise ; rend l'extension en minuscules. */
    public String verifier(TypeOutil type, String nom, long taille) {
        if (taille <= 0) {
            throw new IllegalArgumentException("Le fichier « " + nom + " » est vide");
        }
        long max = taillesMax.getOrDefault(type, 0L);
        if (taille > max) {
            throw new IllegalArgumentException("Le fichier « " + nom + " » dépasse " + (max / MO) + " Mo");
        }
        String extension = extension(nom);
        if (!extensions.getOrDefault(type, Set.of()).contains(extension)) {
            throw new IllegalArgumentException("Fichiers acceptés ici : "
                    + String.join(", ", extensions.getOrDefault(type, Set.of()).stream().sorted().toList()));
        }
        return extension;
    }

    public Set<String> extensions(TypeOutil type) {
        return extensions.getOrDefault(type, Set.of());
    }

    public long tailleMax(TypeOutil type) {
        return taillesMax.getOrDefault(type, 0L);
    }

    private void definir(TypeOutil type, String liste, long tailleMo) {
        extensions.put(type, Arrays.stream(liste.split(","))
                .map(e -> e.trim().toLowerCase(Locale.ROOT))
                .filter(e -> !e.isEmpty())
                .collect(Collectors.toUnmodifiableSet()));
        taillesMax.put(type, tailleMo * MO);
    }

    private static String extension(String nom) {
        int point = nom == null ? -1 : nom.lastIndexOf('.');
        return point < 0 ? "" : nom.substring(point + 1).toLowerCase(Locale.ROOT);
    }
}
