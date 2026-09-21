package com.kinga.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Récupération d'un fichier désigné par son URL.
 *
 * <p>Pensé pour les imports en masse, où les adresses viennent d'un fichier
 * fourni par un utilisateur et non du code : rien n'y est sûr. Trois garde-fous
 * valent donc pour tous les appels :</p>
 *
 * <ul>
 *   <li><b>Schéma</b> : http et https uniquement. Sans cette règle, un
 *       {@code file:///etc/passwd} dans une colonne du tableur ferait lire au
 *       serveur son propre disque.</li>
 *   <li><b>Taille</b> : plafonnée, et vérifiée <em>pendant</em> la lecture et
 *       non seulement sur l'en-tête {@code Content-Length} — un serveur peut
 *       l'omettre ou mentir, et le tas n'est pas extensible.</li>
 *   <li><b>Délais</b> : une adresse qui ne répond jamais ne doit pas immobiliser
 *       l'import des lignes suivantes.</li>
 * </ul>
 *
 * <p>Le type réel du fichier est déterminé par ses premiers octets, pas par
 * l'en-tête {@code Content-Type} : beaucoup de serveurs annoncent
 * {@code application/octet-stream} pour une image parfaitement valide, et à
 * l'inverse un {@code Content-Type} ne prouve rien du contenu.</p>
 *
 * <p><b>Note de sécurité</b> : les adresses privées (127.0.0.1, 10.x, 192.168.x)
 * ne sont volontairement pas bloquées. Une installation sur site héberge
 * souvent ses photos sur le réseau local, et les interdire rendrait la
 * fonctionnalité inutilisable. La contrepartie est qu'un administrateur peut
 * faire interroger le réseau interne par le serveur ; c'est acceptable ici
 * parce que l'import est réservé au droit CAN_CREATE_USER.</p>
 */
public final class DownloadUtils {

    private static final Logger logger = LoggerFactory.getLogger(DownloadUtils.class);

    /** Au-delà, ce n'est plus une photo de profil : on refuse. */
    public static final long TAILLE_MAX_DEFAUT = 10L * 1024 * 1024;

    private static final Duration DELAI_CONNEXION = Duration.ofSeconds(10);
    private static final Duration DELAI_REPONSE = Duration.ofSeconds(30);

    /** Certains hébergeurs renvoient 403 à un client sans identité. */
    private static final String AGENT = "FollowTask/1.0 (import)";

    private static final Set<String> SCHEMAS_AUTORISES = Set.of("http", "https");

    private static final List<String> EXTENSIONS_IMAGE =
            List.of("jpg", "jpeg", "png", "gif", "webp", "bmp");

    /**
     * Client partagé : il porte un pool de connexions, en créer un par ligne
     * d'un import de plusieurs centaines d'utilisateurs épuiserait les threads.
     */
    private static final HttpClient CLIENT = HttpClient.newBuilder()
            .connectTimeout(DELAI_CONNEXION)
            // NORMAL suit les redirections sauf https -> http : une adresse
            // sécurisée ne doit pas retomber en clair sans qu'on le sache.
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private DownloadUtils() {
    }

    /**
     * Fichier rapatrié : son contenu, son type MIME et l'extension à lui donner
     * sur le disque (sans le point).
     */
    public record FichierDistant(byte[] contenu, String typeMime, String extension) {

        /** Le contenu est bien une image, d'après ses premiers octets. */
        public boolean estImage() {
            return typeMime != null && typeMime.startsWith("image/");
        }
    }

    public static FichierDistant telecharger(String url) throws IOException {
        return telecharger(url, TAILLE_MAX_DEFAUT);
    }

    /**
     * Rapatrie le contenu d'une URL.
     *
     * @param url       adresse http ou https
     * @param tailleMax nombre d'octets au-delà duquel le téléchargement est abandonné
     * @throws IOException adresse invalide, hôte injoignable, statut non 2xx,
     *                     ou contenu plus gros que {@code tailleMax}
     */
    public static FichierDistant telecharger(String url, long tailleMax) throws IOException {
        URI uri = analyser(url);

        HttpRequest requete = HttpRequest.newBuilder(uri)
                .timeout(DELAI_REPONSE)
                .header("User-Agent", AGENT)
                .GET()
                .build();

        HttpResponse<InputStream> reponse;
        try {
            reponse = CLIENT.send(requete, HttpResponse.BodyHandlers.ofInputStream());
        } catch (InterruptedException e) {
            // Ne jamais avaler une interruption : la reposer pour que l'appelant
            // au-dessus puisse s'arrêter à son tour.
            Thread.currentThread().interrupt();
            throw new IOException("Téléchargement interrompu : " + url, e);
        }

        try (InputStream flux = reponse.body()) {
            if (reponse.statusCode() < 200 || reponse.statusCode() >= 300) {
                throw new IOException("Réponse HTTP " + reponse.statusCode() + " pour " + url);
            }
            refuserSiTropGros(reponse, tailleMax, url);

            byte[] contenu = lire(flux, tailleMax, url);
            String extension = extensionDe(contenu, reponse, uri);
            String typeMime = typeMimeDe(contenu, reponse);

            logger.debug("Téléchargé {} ({} octets, {})", url, contenu.length, typeMime);
            return new FichierDistant(contenu, typeMime, extension);
        }
    }

    private static URI analyser(String url) throws IOException {
        if (url == null || url.isBlank()) {
            throw new IOException("Adresse vide");
        }
        URI uri;
        try {
            uri = URI.create(url.trim());
        } catch (IllegalArgumentException e) {
            throw new IOException("Adresse invalide : " + url, e);
        }
        String schema = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!SCHEMAS_AUTORISES.contains(schema)) {
            throw new IOException("Seules les adresses http et https sont acceptées : " + url);
        }
        if (uri.getHost() == null) {
            throw new IOException("Adresse sans nom d'hôte : " + url);
        }
        return uri;
    }

    /** Refus immédiat quand le serveur annonce lui-même une taille excessive. */
    private static void refuserSiTropGros(HttpResponse<?> reponse, long tailleMax, String url) throws IOException {
        long annoncee = reponse.headers().firstValueAsLong("Content-Length").orElse(-1);
        if (annoncee > tailleMax) {
            throw new IOException("Fichier trop volumineux (" + annoncee + " octets) : " + url);
        }
    }

    private static byte[] lire(InputStream flux, long tailleMax, String url) throws IOException {
        ByteArrayOutputStream tampon = new ByteArrayOutputStream();
        byte[] morceau = new byte[8192];
        long total = 0;
        int lus;
        while ((lus = flux.read(morceau)) != -1) {
            total += lus;
            if (total > tailleMax) {
                throw new IOException("Fichier trop volumineux (plus de " + tailleMax + " octets) : " + url);
            }
            tampon.write(morceau, 0, lus);
        }
        if (total == 0) {
            throw new IOException("Fichier vide : " + url);
        }
        return tampon.toByteArray();
    }

    // ------------------------------------------------------------------
    // Type réel du contenu
    // ------------------------------------------------------------------

    /**
     * Extension à donner au fichier : d'abord ses octets de tête, puis le
     * Content-Type annoncé, puis en dernier recours celle de l'URL.
     */
    private static String extensionDe(byte[] contenu, HttpResponse<?> reponse, URI uri) {
        String parSignature = extensionParSignature(contenu);
        if (parSignature != null) {
            return parSignature;
        }
        String parType = extensionParTypeMime(typeMimeAnnonce(reponse));
        if (parType != null) {
            return parType;
        }
        return extensionParChemin(uri);
    }

    private static String typeMimeDe(byte[] contenu, HttpResponse<?> reponse) {
        String parSignature = extensionParSignature(contenu);
        if (parSignature != null) {
            return "image/" + ("jpg".equals(parSignature) ? "jpeg" : parSignature);
        }
        String annonce = typeMimeAnnonce(reponse);
        return annonce == null ? "application/octet-stream" : annonce;
    }

    private static String typeMimeAnnonce(HttpResponse<?> reponse) {
        return reponse.headers().firstValue("Content-Type")
                // "image/jpeg; charset=binary" : seule la partie avant le ; compte.
                .map(valeur -> valeur.split(";")[0].trim().toLowerCase(Locale.ROOT))
                .filter(valeur -> !valeur.isEmpty())
                .orElse(null);
    }

    /** Signatures (magic numbers) des formats d'image courants. */
    private static String extensionParSignature(byte[] o) {
        if (o.length >= 3 && (o[0] & 0xFF) == 0xFF && (o[1] & 0xFF) == 0xD8 && (o[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (o.length >= 8 && (o[0] & 0xFF) == 0x89 && o[1] == 'P' && o[2] == 'N' && o[3] == 'G'
                && (o[4] & 0xFF) == 0x0D && (o[5] & 0xFF) == 0x0A && (o[6] & 0xFF) == 0x1A && (o[7] & 0xFF) == 0x0A) {
            return "png";
        }
        if (o.length >= 6 && o[0] == 'G' && o[1] == 'I' && o[2] == 'F' && o[3] == '8') {
            return "gif";
        }
        // WEBP : "RIFF" .... "WEBP"
        if (o.length >= 12 && o[0] == 'R' && o[1] == 'I' && o[2] == 'F' && o[3] == 'F'
                && o[8] == 'W' && o[9] == 'E' && o[10] == 'B' && o[11] == 'P') {
            return "webp";
        }
        if (o.length >= 2 && o[0] == 'B' && o[1] == 'M') {
            return "bmp";
        }
        return null;
    }

    private static String extensionParTypeMime(String typeMime) {
        if (typeMime == null) {
            return null;
        }
        return switch (typeMime) {
            case "image/jpeg", "image/jpg", "image/pjpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/gif" -> "gif";
            case "image/webp" -> "webp";
            case "image/bmp", "image/x-ms-bmp" -> "bmp";
            default -> null;
        };
    }

    /**
     * Extension lue dans le chemin de l'URL. La requête est écartée :
     * "photo.png?v=2" doit donner "png" et non "png?v=2".
     */
    private static String extensionParChemin(URI uri) {
        String chemin = uri.getPath();
        if (chemin == null) {
            return "";
        }
        int point = chemin.lastIndexOf('.');
        int slash = chemin.lastIndexOf('/');
        if (point <= slash || point == chemin.length() - 1) {
            return "";
        }
        String extension = chemin.substring(point + 1).toLowerCase(Locale.ROOT);
        return extension.matches("[a-z0-9]{1,5}") ? extension : "";
    }

    /** Extensions considérées comme des images, pour chercher un fichier déjà présent. */
    public static List<String> extensionsImage() {
        return EXTENSIONS_IMAGE;
    }
}
