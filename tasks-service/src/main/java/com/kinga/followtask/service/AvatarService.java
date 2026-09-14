package com.kinga.followtask.service;

import com.kinga.followtask.entity.UserApp;
import com.kinga.utils.KingaUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Collection;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Vignettes d'avatar : une seule image par utilisateur, petite, servie aussi
 * bien à l'écran qu'aux exports.
 *
 * <p>La photo d'origine est gardée telle qu'elle a été téléversée — c'est elle
 * qu'on affiche en grand sur la fiche de profil — mais elle ne sert jamais
 * d'avatar : une photo de téléphone pèse plusieurs méga-octets, et un tableau
 * de demandes en réclame une par ligne. On en dérive une vignette de
 * {@value #TAILLE} pixels, quelques kilo-octets, écrite à côté de l'original et
 * regénérée si l'original change.</p>
 *
 * <p>Un utilisateur sans photo n'est pas un trou : ses initiales sont dessinées
 * sur un fond dérivé de son identifiant. C'est une image comme une autre, donc
 * elle traverse sans cas particulier le HTML, le PDF et le classeur Excel.</p>
 *
 * <p>Les octets sont produits une fois puis gardés en mémoire, indexés par une
 * <em>version</em> — la date de dernière modification du fichier. Une photo
 * remplacée change de version, ce qui périme l'entrée du cache, invalide le
 * cache du navigateur et évite d'avoir à prévenir qui que ce soit.</p>
 */
@Service
public class AvatarService {

    /** Côté de la vignette, en pixels. Deux fois la taille d'affichage la plus
     *  grande de l'application : les écrans à forte densité ne la trouvent pas
     *  floue, et elle reste sous les 5 Ko. */
    public static final int TAILLE = 96;

    private static final Logger logger = LoggerFactory.getLogger(AvatarService.class);

    private static final String SUFFIXE_VIGNETTE = "-" + TAILLE + ".jpg";
    private static final String PREFIXE_JPEG = "data:image/jpeg;base64,";
    private static final String PREFIXE_PNG = "data:image/png;base64,";
    /** Compromis usuel pour une photo d'identité de cette taille : au-delà, le
     *  poids monte sans que l'œil y gagne. */
    private static final float QUALITE_JPEG = 0.82f;
    /** Version des avatars d'initiales : aucun fichier ne les porte, mais le
     *  client a besoin d'une valeur stable pour savoir qu'il les a déjà. */
    private static final String VERSION_INITIALES = "i";

    /**
     * @param version  ce qui distingue deux états successifs de l'avatar
     * @param octets   l'image elle-même, telle qu'elle part sur le réseau
     * @param dataUri  la même image en {@code data:} — l'export HTML et le PDF
     *                 n'ont pas d'autre moyen de la porter
     */
    private record Avatar(String version, byte[] octets, String dataUri, String typeMime) {
    }

    private final Map<String, Avatar> cache = new ConcurrentHashMap<>();

    // ------------------------------------------------------------------
    // Lecture
    // ------------------------------------------------------------------

    /** Octets de la vignette, prêts à être servis ou insérés dans un classeur. */
    public byte[] octets(UserApp user) {
        Avatar avatar = avatar(user);
        return avatar == null ? null : avatar.octets();
    }

    /** Type MIME des octets renvoyés par {@link #octets(UserApp)}. */
    public String typeMime(UserApp user) {
        Avatar avatar = avatar(user);
        return avatar == null ? null : avatar.typeMime();
    }

    /**
     * L'avatar sous forme de {@code data:} — l'image est dans le document, il
     * n'y a plus de requête à faire ni d'authentification à présenter. C'est ce
     * qui permet à un PDF ou à une page exportée de rester lisible hors de
     * l'application.
     */
    public String dataUri(UserApp user) {
        Avatar avatar = avatar(user);
        return avatar == null ? null : avatar.dataUri();
    }

    /**
     * Version courante de l'avatar : la date de modification de la photo, ou
     * une constante pour les initiales. Le client s'en sert pour ne demander
     * que ce qui a changé depuis sa dernière visite.
     */
    public String version(UserApp user) {
        Avatar avatar = avatar(user);
        return avatar == null ? null : avatar.version();
    }

    /** Versions de tout un groupe, en une passe — la réponse tient en quelques
     *  centaines d'octets là où les images pèsent des méga-octets. */
    public Map<String, String> versions(Collection<UserApp> users) {
        return collecter(users, this::version);
    }

    /** Avatars d'un groupe, encodés pour être posés directement dans du HTML. */
    public Map<String, String> dataUris(Collection<UserApp> users) {
        return collecter(users, this::dataUri);
    }

    private Map<String, String> collecter(Collection<UserApp> users,
                                          java.util.function.Function<UserApp, String> lecture) {
        Map<String, String> resultat = new LinkedHashMap<>();
        if (users == null) {
            return resultat;
        }
        for (UserApp user : users) {
            if (user == null || user.getId() == null) {
                continue;
            }
            String valeur = lecture.apply(user);
            if (valeur != null) {
                resultat.put(user.getId(), valeur);
            }
        }
        return resultat;
    }

    // ------------------------------------------------------------------
    // Écriture
    // ------------------------------------------------------------------

    /**
     * Prend acte d'une nouvelle photo : la vignette est refaite tout de suite
     * plutôt qu'au premier affichage, pour que l'utilisateur voie son changement
     * dès le rechargement de la page.
     *
     * @param original chemin du fichier qui vient d'être écrit
     */
    public void rafraichir(UserApp user, Path original) {
        if (user == null || user.getId() == null) {
            return;
        }
        cache.remove(user.getId());
        try {
            Files.deleteIfExists(cheminVignette(original, user.getId()));
        } catch (IOException e) {
            // La vignette périmée sera écrasée à la génération suivante : son
            // effacement n'est qu'un nettoyage.
            logger.debug("Vignette précédente de {} non supprimée", user.getId(), e);
        }
        avatar(user);
    }

    /** Oublie ce qui est gardé en mémoire pour un utilisateur. */
    public void invalider(String userId) {
        if (userId != null) {
            cache.remove(userId);
        }
    }

    // ------------------------------------------------------------------
    // Fabrication
    // ------------------------------------------------------------------

    private Avatar avatar(UserApp user) {
        if (user == null || user.getId() == null) {
            return null;
        }
        Path original = cheminPhoto(user);
        String version = version(original, user);

        Avatar connu = cache.get(user.getId());
        if (connu != null && connu.version().equals(version)) {
            return connu;
        }

        byte[] octets = original == null ? null : vignette(original, user.getId());
        Avatar avatar = octets != null
                ? new Avatar(version, octets, PREFIXE_JPEG + encoder(octets), "image/jpeg")
                : initiales(user, version);
        cache.put(user.getId(), avatar);
        return avatar;
    }

    /**
     * Chemin de la photo téléversée, ou {@code null} si l'utilisateur n'en a
     * pas — ou si celle qui est enregistrée a disparu du disque, ce qui arrive
     * quand le répertoire des profils est déplacé.
     */
    private Path cheminPhoto(UserApp user) {
        if (!StringUtils.hasText(user.getPhoto())) {
            return null;
        }
        try {
            Path chemin = Paths.get(KingaUtils.decodeText(user.getPhoto()));
            return Files.isReadable(chemin) ? chemin : null;
        } catch (RuntimeException e) {
            logger.debug("Chemin de photo illisible pour {}", user.getId(), e);
            return null;
        }
    }

    private String version(Path original, UserApp user) {
        if (original != null) {
            try {
                return Long.toString(Files.getLastModifiedTime(original).toMillis());
            } catch (IOException e) {
                logger.debug("Date de la photo de {} illisible", user.getId(), e);
            }
        }
        // Les initiales dépendent du nom : le client doit recharger l'avatar
        // quand ce nom change, pas seulement quand une photo apparaît.
        return VERSION_INITIALES + Objects.hash(initialesDe(user));
    }

    /**
     * Vignette de la photo : relue sur le disque si elle y est déjà à jour,
     * fabriquée et enregistrée sinon.
     *
     * @return {@code null} si l'image est illisible ou dans un format que
     *         l'ImageIO de la plate-forme ne sait pas décoder — l'appelant
     *         retombe alors sur les initiales, ce qui vaut mieux qu'un carré
     *         cassé.
     */
    private byte[] vignette(Path original, String userId) {
        Path vignette = cheminVignette(original, userId);
        try {
            if (Files.exists(vignette)
                    && Files.getLastModifiedTime(vignette).compareTo(Files.getLastModifiedTime(original)) >= 0) {
                return Files.readAllBytes(vignette);
            }
        } catch (IOException e) {
            logger.debug("Vignette existante de {} illisible, régénération", userId, e);
        }

        byte[] octets = reduire(original);
        if (octets == null) {
            return null;
        }
        try {
            Files.write(vignette, octets);
        } catch (IOException e) {
            // Un répertoire de profils en lecture seule ne doit pas priver
            // l'application d'avatars : on garde les octets en mémoire.
            logger.warn("Vignette de {} non enregistrée sur disque", userId, e);
        }
        return octets;
    }

    private Path cheminVignette(Path original, String userId) {
        return original.resolveSibling(userId + SUFFIXE_VIGNETTE);
    }

    /**
     * Réduction proprement dite : on recadre au carré avant de redimensionner,
     * sans quoi un portrait en pied donnerait un avatar écrasé.
     */
    private byte[] reduire(Path original) {
        try {
            BufferedImage source = ImageIO.read(original.toFile());
            if (source == null) {
                logger.warn("Format d'image non reconnu : {}", original);
                return null;
            }
            int cote = Math.min(source.getWidth(), source.getHeight());
            BufferedImage carre = source.getSubimage((source.getWidth() - cote) / 2,
                    (source.getHeight() - cote) / 2, cote, cote);

            BufferedImage cible = new BufferedImage(TAILLE, TAILLE, BufferedImage.TYPE_INT_RGB);
            Graphics2D dessin = cible.createGraphics();
            try {
                // Le JPEG ignore la transparence : sans ce fond, un PNG détouré
                // ressortirait sur du noir.
                dessin.setColor(Color.WHITE);
                dessin.fillRect(0, 0, TAILLE, TAILLE);
                dessin.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
                        RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                dessin.setRenderingHint(RenderingHints.KEY_RENDERING,
                        RenderingHints.VALUE_RENDER_QUALITY);
                dessin.drawImage(carre.getScaledInstance(TAILLE, TAILLE, java.awt.Image.SCALE_SMOOTH),
                        0, 0, null);
            } finally {
                dessin.dispose();
            }
            return encoderJpeg(cible);
        } catch (IOException | RuntimeException e) {
            // Une photo corrompue ne doit pas faire échouer l'écran qui la
            // demande : l'utilisateur aura ses initiales.
            logger.warn("Vignette impossible à produire depuis {}", original, e);
            return null;
        }
    }

    private byte[] encoderJpeg(BufferedImage image) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext()) {
            throw new IOException("Aucun encodeur JPEG disponible");
        }
        ImageWriter writer = writers.next();
        try (ByteArrayOutputStream sortie = new ByteArrayOutputStream();
             ImageOutputStream flux = ImageIO.createImageOutputStream(sortie)) {
            writer.setOutput(flux);
            ImageWriteParam parametres = writer.getDefaultWriteParam();
            parametres.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            parametres.setCompressionQuality(QUALITE_JPEG);
            writer.write(null, new IIOImage(image, null, null), parametres);
            flux.flush();
            return sortie.toByteArray();
        } finally {
            writer.dispose();
        }
    }

    // ------------------------------------------------------------------
    // Avatar d'initiales
    // ------------------------------------------------------------------

    /**
     * Avatar de repli, dessiné plutôt que téléchargé.
     *
     * <p>En PNG et non en SVG : le moteur PDF ne rend pas le SVG sans greffon,
     * et Excel ne le connaît pas du tout. Une image matricielle passe partout.</p>
     */
    private Avatar initiales(UserApp user, String version) {
        String texte = initialesDe(user);
        BufferedImage image = new BufferedImage(TAILLE, TAILLE, BufferedImage.TYPE_INT_RGB);
        Graphics2D dessin = image.createGraphics();
        try {
            dessin.setRenderingHint(RenderingHints.KEY_ANTIALIASING,
                    RenderingHints.VALUE_ANTIALIAS_ON);
            dessin.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,
                    RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            dessin.setColor(couleur(user));
            dessin.fillRect(0, 0, TAILLE, TAILLE);

            dessin.setColor(Color.WHITE);
            dessin.setFont(new Font(Font.SANS_SERIF, Font.BOLD, TAILLE * 4 / 10));
            FontMetrics mesures = dessin.getFontMetrics();
            int x = (TAILLE - mesures.stringWidth(texte)) / 2;
            // La ligne de base se place sur le centre optique et non sur le
            // milieu géométrique : sinon le texte paraît trop bas.
            int y = (TAILLE - mesures.getHeight()) / 2 + mesures.getAscent();
            dessin.drawString(texte, x, y);
        } finally {
            dessin.dispose();
        }
        byte[] octets = encoderPng(image);
        return new Avatar(version, octets, PREFIXE_PNG + encoder(octets), "image/png");
    }

    private byte[] encoderPng(BufferedImage image) {
        try (ByteArrayOutputStream sortie = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", sortie);
            return sortie.toByteArray();
        } catch (IOException e) {
            // Écriture en mémoire : l'échec relève de l'anomalie, pas du cas
            // limite. Un tableau vide vaut mieux qu'une exception qui remonte
            // jusqu'à l'écran.
            logger.error("Avatar d'initiales non encodé", e);
            return new byte[0];
        }
    }

    /** Deux lettres : l'initiale du prénom et celle du nom, à défaut le début
     *  de l'identifiant de connexion. */
    private String initialesDe(UserApp user) {
        String prenom = premiereLettre(user.getFirstName());
        String nom = premiereLettre(user.getLastName());
        String initiales = prenom + nom;
        if (!initiales.isEmpty()) {
            return initiales;
        }
        String username = user.getUsername() == null ? "" : user.getUsername().trim();
        if (username.isEmpty()) {
            return "?";
        }
        return username.substring(0, Math.min(2, username.length())).toUpperCase();
    }

    private String premiereLettre(String valeur) {
        String propre = valeur == null ? "" : valeur.trim();
        return propre.isEmpty() ? "" : propre.substring(0, 1).toUpperCase();
    }

    /**
     * Couleur du fond, déduite de l'identifiant : la même personne garde la
     * même couleur d'un écran à l'autre et d'un export à l'autre, ce qui la
     * rend reconnaissable avant même d'avoir lu son nom.
     *
     * <p>Saturation et luminosité sont fixes pour que le blanc du texte reste
     * lisible quelle que soit la teinte tirée.</p>
     */
    private Color couleur(UserApp user) {
        int empreinte = Math.abs(Objects.hashCode(user.getId()));
        return Color.getHSBColor((empreinte % 360) / 360f, 0.55f, 0.62f);
    }

    private String encoder(byte[] octets) {
        return Base64.getEncoder().encodeToString(octets);
    }
}
