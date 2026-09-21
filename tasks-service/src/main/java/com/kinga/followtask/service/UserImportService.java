package com.kinga.followtask.service;

import com.kinga.followtask.config.ConfigSystem;
import com.kinga.followtask.dto.RapportImportUsers;
import com.kinga.followtask.dto.RapportImportUsers.LigneImport;
import com.kinga.followtask.dto.RapportImportUsers.Statut;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.UserRepository;
import com.kinga.utils.DownloadUtils;
import com.kinga.utils.ExcelUtils;
import com.kinga.utils.KingaUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Création d'utilisateurs en masse à partir d'un classeur Excel.
 *
 * <p>Colonnes attendues sur la première feuille, en-tête en première ligne :
 * username, email, Nom, Prenom, cin, contact, password, urlPhoto. Seul l'ordre
 * est libre ; les noms sont reconnus sans tenir compte de la casse, des accents
 * ni des espaces, et plusieurs intitulés usuels sont acceptés pour la même
 * colonne (« Prenom » ou « firstName »).</p>
 *
 * <p>Deux principes gouvernent le traitement :</p>
 *
 * <ol>
 *   <li><b>Une ligne fautive n'emporte pas les autres.</b> Chaque ligne est
 *       traitée isolément : {@link UserService#save} lève une exception à la
 *       moindre règle enfreinte (numéro invalide, identifiant déjà pris), et
 *       cette exception devient un motif de rejet dans le rapport, pas l'échec
 *       de l'import. Cette méthode n'est délibérément pas {@code @Transactional} :
 *       une transaction d'ensemble annulerait les 199 lignes correctes à cause
 *       de la 200e.</li>
 *   <li><b>La photo n'est jamais bloquante.</b> Une adresse morte ou un
 *       serveur lent ne doit pas empêcher la création du compte : l'utilisateur
 *       est créé sans photo et la ligne est signalée CREE_SANS_PHOTO.</li>
 * </ol>
 *
 * <p>La photo est rangée comme celle d'un téléversement normal — dans le
 * répertoire des profils, chemin encodé dans {@code UserApp.photo} — mais
 * nommée d'après l'identifiant plutôt que d'après l'id technique, pour qu'un
 * administrateur puisse déposer ou remplacer les fichiers à la main. Un fichier
 * déjà présent n'est jamais écrasé : il est réutilisé tel quel.</p>
 */
@Service
@RequiredArgsConstructor
public class UserImportService {

    private static final Logger logger = LoggerFactory.getLogger(UserImportService.class);

    private final UserService userService;
    private final UserRepository userRepository;
    private final ConfigSystem configSystem;

    /** Première ligne de données : l'en-tête occupe la ligne 1. */
    private static final int PREMIERE_LIGNE_DONNEES = 2;

    /** Colonnes du modèle, dans l'ordre où elles y apparaissent. */
    private static final List<String> COLONNES_MODELE =
            List.of("username", "email", "Nom", "Prenom", "cin", "contact", "password", "urlPhoto");

    // ------------------------------------------------------------------
    // Import
    // ------------------------------------------------------------------

    public RapportImportUsers importer(InputStream classeur) throws IOException {
        Map<String, List<Map<String, Object>>> feuilles = ExcelUtils.getDatas(classeur);
        List<Map<String, Object>> lignes = premiereFeuille(feuilles);

        List<LigneImport> details = new ArrayList<>();
        int crees = 0;
        int rejetes = 0;

        for (int i = 0; i < lignes.size(); i++) {
            LigneImport detail = traiter(lignes.get(i), PREMIERE_LIGNE_DONNEES + i);
            details.add(detail);
            if (detail.statut() == Statut.REJETE) {
                rejetes++;
            } else {
                crees++;
            }
        }
        return new RapportImportUsers(lignes.size(), crees, rejetes, details);
    }

    /**
     * L'import ne lit que la première feuille : un classeur exporté depuis un
     * autre outil traîne souvent des feuilles annexes (notices, listes de
     * validation) qu'il ne faut surtout pas prendre pour des utilisateurs.
     */
    private List<Map<String, Object>> premiereFeuille(Map<String, List<Map<String, Object>>> feuilles) throws IOException {
        if (feuilles == null || feuilles.isEmpty()) {
            throw new IOException("Le classeur ne contient aucune feuille.");
        }
        List<Map<String, Object>> lignes = feuilles.values().iterator().next();
        return lignes == null ? List.of() : lignes;
    }

    private LigneImport traiter(Map<String, Object> ligne, int numero) {
        Map<String, Object> champs = normaliserEntetes(ligne);
        String username = texte(champs, "username", "nomutilisateur", "login", "identifiant");

        UserApp utilisateur;
        try {
            utilisateur = userService.save(construire(champs, username));
        } catch (Exception e) {
            // Le message porté par UserService ("Contact ... is already in used",
            // "Password requered"…) est le motif le plus parlant qu'on ait.
            logger.info("Import : ligne {} rejetée ({})", numero, e.getMessage());
            return new LigneImport(numero, username, Statut.REJETE, motif(e));
        }

        String urlPhoto = texte(champs, "urlphoto", "photo", "urlimage", "avatar");
        if (!StringUtils.hasText(urlPhoto)) {
            return new LigneImport(numero, utilisateur.getUsername(), Statut.CREE, "");
        }
        try {
            rattacherPhoto(utilisateur, urlPhoto);
            return new LigneImport(numero, utilisateur.getUsername(), Statut.CREE, "");
        } catch (Exception e) {
            logger.info("Import : photo ignorée pour {} ({})", utilisateur.getUsername(), e.getMessage());
            return new LigneImport(numero, utilisateur.getUsername(), Statut.CREE_SANS_PHOTO,
                    "Photo non récupérée : " + motif(e));
        }
    }

    private UserApp construire(Map<String, Object> champs, String username) {
        UserApp utilisateur = new UserApp();
        utilisateur.setUsername(username);
        utilisateur.setEmail(texte(champs, "email", "mail", "adressemail", "courriel"));
        utilisateur.setLastName(texte(champs, "nom", "lastname", "nomdefamille"));
        utilisateur.setFirstName(texte(champs, "prenom", "firstname"));
        utilisateur.setCin(texte(champs, "cin", "numerocin", "cni"));
        utilisateur.setContact(telephone(texte(champs, "contact", "telephone", "tel", "numero", "phone")));
        utilisateur.setPassword(texte(champs, "password", "motdepasse", "mdp"));
        return utilisateur;
    }

    private String motif(Exception e) {
        String message = e.getMessage();
        return StringUtils.hasText(message) ? message : e.getClass().getSimpleName();
    }

    // ------------------------------------------------------------------
    // Photo
    // ------------------------------------------------------------------

    /**
     * Récupère la photo et la range sous {@code <username>.<extension>}.
     *
     * <p>Un fichier portant déjà ce nom est réutilisé sans rien télécharger :
     * l'import est ainsi rejouable sans refaire des centaines d'allers-retours
     * réseau, et une photo déposée à la main par un administrateur fait
     * autorité sur celle du tableur.</p>
     */
    private void rattacherPhoto(UserApp utilisateur, String urlPhoto) throws IOException {
        Path dossier = Paths.get(repertoirePhotos());
        Files.createDirectories(dossier);

        String base = nomDeFichier(utilisateur.getUsername());
        Optional<Path> deja = photoExistante(dossier, base);

        Path fichier;
        if (deja.isPresent()) {
            fichier = deja.get();
        } else {
            DownloadUtils.FichierDistant distant = DownloadUtils.telecharger(urlPhoto);
            if (!distant.estImage()) {
                throw new IOException("le contenu de l'adresse n'est pas une image");
            }
            fichier = dossier.resolve(base + "." + distant.extension());
            Files.write(fichier, distant.contenu());
        }

        utilisateur.setPhoto(KingaUtils.encodeText(fichier.toString()));
        userRepository.save(utilisateur);
    }

    private String repertoirePhotos() throws IOException {
        return StringUtils.hasText(configSystem.getProfileDirectories())
                ? configSystem.getProfileDirectories()
                : KingaUtils.getDefaultMediaSpaceDirectory();
    }

    private Optional<Path> photoExistante(Path dossier, String base) {
        for (String extension : DownloadUtils.extensionsImage()) {
            Path candidat = dossier.resolve(base + "." + extension);
            if (Files.exists(candidat)) {
                return Optional.of(candidat);
            }
        }
        return Optional.empty();
    }

    /**
     * Un identifiant se retrouve tel quel dans un nom de fichier : tout ce qui
     * n'est pas alphanumérique est neutralisé, pour qu'un « ../ » glissé dans la
     * colonne username ne fasse pas écrire ailleurs que dans le dossier prévu.
     */
    private String nomDeFichier(String username) {
        String propre = username == null ? "" : username.replaceAll("[^A-Za-z0-9._-]", "_");
        return propre.isBlank() ? "utilisateur" : propre;
    }

    // ------------------------------------------------------------------
    // Lecture des cellules
    // ------------------------------------------------------------------

    /**
     * Ré-indexe la ligne sur des en-têtes normalisés : « Prénom », « PRENOM » et
     * « prenom » désignent la même colonne, et un tableur rempli à la main ne
     * respecte jamais une casse imposée.
     */
    private Map<String, Object> normaliserEntetes(Map<String, Object> ligne) {
        Map<String, Object> champs = new LinkedHashMap<>();
        if (ligne == null) {
            return champs;
        }
        ligne.forEach((entete, valeur) -> champs.putIfAbsent(normaliser(entete), valeur));
        return champs;
    }

    private String normaliser(String valeur) {
        if (valeur == null) {
            return "";
        }
        return Normalizer.normalize(valeur, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");
    }

    /** Première colonne renseignée parmi les intitulés acceptés. */
    private String texte(Map<String, Object> champs, String... alias) {
        for (String alias1 : alias) {
            Object valeur = champs.get(alias1);
            String texte = enTexte(valeur);
            if (StringUtils.hasText(texte)) {
                return texte;
            }
        }
        return null;
    }

    /**
     * Une cellule n'est pas toujours du texte. Excel rend un nombre entier pour
     * un CIN ou un numéro saisi sans apostrophe, et une date pour ce qui y
     * ressemble ; {@code toString()} sur un Double donnerait « 3.41234567E8 ».
     */
    private String enTexte(Object valeur) {
        if (valeur == null) {
            return null;
        }
        if (valeur instanceof Double nombre && nombre == Math.floor(nombre) && !nombre.isInfinite()) {
            return String.valueOf(nombre.longValue());
        }
        if (valeur instanceof LocalDateTime date) {
            return date.toLocalDate().toString();
        }
        String texte = valeur.toString().trim();
        return texte.isEmpty() ? null : texte;
    }

    /**
     * Rétablit le zéro initial mangé par Excel.
     *
     * <p>« 0341234567 » saisi sans mettre la colonne en texte devient le nombre
     * 341234567 : le zéro disparaît, et le numéro ne passe plus la validation de
     * {@code UserService} qui attend {@code (261|0)(32|33|34|38)} suivi de sept
     * chiffres. C'est de loin la première cause de rejet d'un import, et elle se
     * corrige ici sans rien demander à l'utilisateur.</p>
     */
    private String telephone(String valeur) {
        if (!StringUtils.hasText(valeur)) {
            return valeur;
        }
        String chiffres = valeur.replaceAll("[\\s.+-]", "");
        if (chiffres.matches("^(32|33|34|38)\\d{7}$")) {
            return "0" + chiffres;
        }
        return chiffres;
    }

    // ------------------------------------------------------------------
    // Modèle de fichier
    // ------------------------------------------------------------------

    /**
     * Écrit le classeur vierge à remplir. Le fournir évite l'aller-retour
     * habituel où l'utilisateur devine les intitulés et se fait rejeter.
     */
    public void ecrireModele(OutputStream sortie) throws IOException {
        Map<String, Integer> entetes = new LinkedHashMap<>();
        for (int i = 0; i < COLONNES_MODELE.size(); i++) {
            entetes.put(COLONNES_MODELE.get(i), i);
        }

        Map<String, Object> exemple = new LinkedHashMap<>();
        exemple.put("username", "rakoto.j");
        exemple.put("email", "jean.rakoto@exemple.mg");
        exemple.put("Nom", "RAKOTO");
        exemple.put("Prenom", "Jean");
        exemple.put("cin", "101234567890");
        exemple.put("contact", "0341234567");
        exemple.put("password", "MotDePasse2026");
        exemple.put("urlPhoto", "https://exemple.mg/photos/jean.jpg");

        ExcelUtils.write(List.of(exemple), entetes, sortie);
    }
}
