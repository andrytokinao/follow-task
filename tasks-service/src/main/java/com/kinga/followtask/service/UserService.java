package com.kinga.followtask.service;


import com.kinga.followtask.config.ConfigSystem;
import com.kinga.followtask.dto.UserDetailsDeto;
import com.kinga.followtask.dto.UserPageDTO;
import com.kinga.followtask.dto.UserSearchDTO;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.UserRepository;
import com.kinga.utils.KingaUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

import static com.kinga.utils.KingaUtils.*;


@Service
@RequiredArgsConstructor
public class UserService {
    @Autowired

    AuthorizationService authorizationService;
    @Autowired
    UserRepository userRepository;

   private final ConfigSystem  configSystem;
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    /** Taille de page par defaut, et plafond : une page de 500 lignes serait un
     *  chargement complet deguise. */
    private static final int TAILLE_DEFAUT = 20;
    private static final int TAILLE_MAX = 200;

    /**
     * Recherche paginee d'utilisateurs.
     *
     * Le tri est traduit en colonnes reelles : `name` couvre nom PUIS prenom,
     * l'ordre dans lequel la liste les affiche. Un champ inconnu retombe sur ce
     * tri par defaut plutot que de lever — le client ne doit pas pouvoir casser
     * la page en envoyant une valeur inattendue.
     */
    public UserPageDTO rechercherUtilisateurs(UserSearchDTO criteres) {
        UserSearchDTO criteria = criteres == null ? new UserSearchDTO() : criteres;

        int page = Math.max(0, criteria.getPage() == null ? 0 : criteria.getPage());
        int taille = criteria.getSize() == null ? TAILLE_DEFAUT : criteria.getSize();
        taille = Math.min(TAILLE_MAX, Math.max(1, taille));

        boolean ascendant = !Boolean.FALSE.equals(criteria.getSortAsc());
        Sort tri = trier(criteria.getSortBy(), ascendant);

        String texte = criteria.getText() == null ? null : criteria.getText().trim().toLowerCase();
        // `null` et non `%%` : la requete court-circuite alors toutes les
        // comparaisons au lieu de les evaluer sur chaque ligne.
        String terme = (texte == null || texte.isEmpty()) ? null : "%" + texte + "%";

        Page<UserApp> resultat =
                userRepository.rechercher(terme, PageRequest.of(page, taille, tri));

        return new UserPageDTO(
                resultat.getContent(),
                resultat.getNumber(),
                resultat.getSize(),
                resultat.getTotalElements(),
                resultat.getTotalPages());
    }

    private Sort trier(String champ, boolean ascendant) {
        Sort.Direction sens = ascendant ? Sort.Direction.ASC : Sort.Direction.DESC;
        if ("username".equalsIgnoreCase(champ)) {
            return Sort.by(sens, "username");
        }
        if ("cin".equalsIgnoreCase(champ)) {
            return Sort.by(sens, "cin");
        }
        return Sort.by(sens, "lastName").and(Sort.by(sens, "firstName"));
    }


    public <S extends UserApp> List<S> saveAllAndFlush(Iterable<S> entities) {
        return userRepository.saveAllAndFlush(entities);
    }



    @Deprecated
    public void deleteInBatch(Iterable<UserApp> entities) {
        userRepository.deleteInBatch(entities);
    }

    public void deleteAllInBatch(Iterable<UserApp> entities) {
        userRepository.deleteAllInBatch(entities);
    }


    public void deleteAllInBatch() {
        userRepository.deleteAllInBatch();
    }

    @Deprecated
    public UserApp getOne(String string) {
        return userRepository.getOne(string);
    }

    @Deprecated
    public UserApp getById(String string) {
        return userRepository.getById(string);
    }

    public UserApp getReferenceById(String string) {
        return userRepository.getReferenceById(string);
    }

    public <S extends UserApp> List<S> findAll(Example<S> example) {
        return userRepository.findAll(example);
    }

    public <S extends UserApp> List<S> findAll(Example<S> example, Sort sort) {
        return userRepository.findAll(example, sort);
    }

    public List<UserApp> findAll() {
        return userRepository.findAll();
    }

    public UserApp save(UserApp entity) {
        boolean isNew = false;
        if(StringUtils.isEmpty(entity.getId())){
            UUID uuid = UUID.randomUUID();
            entity.setId(uuid.toString());
            isNew = true;
        }

        if (!StringUtils.isEmpty(entity.getUsername()) && isNew) {
            UserApp userApp = userRepository.findByUsername(entity.getUsername());
            if (userApp != null && (!(entity.getId().equalsIgnoreCase(userApp.getId()))))
                throw new RuntimeException("Usename " + entity.getUsername() + " is alredy in used");
        }
        if (StringUtils.isEmpty(entity.getUsername())){
            entity.setUsername(generateUsername(entity.getFirstName(), entity.getLastName()));
        }

        if (StringUtils.isEmpty(entity.getContact())) {
            // TODO   throw new RuntimeException("Contact is requered");
        }
        if (!isValidPhoneNumber(entity.getContact())) {
            throw new RuntimeException("Pleas , make contact valid for " + entity.getContact());
        }
        entity.setContact(cleanPhonNumber(entity.getContact()));
        UserApp userApp = null;
        if (!StringUtils.isEmpty(entity.getEmail()) && isNew) {
            userApp = userRepository.findByEmail(entity.getEmail().trim());
            if (userApp != null && !(entity.getId().equalsIgnoreCase(userApp.getId())))
                throw new RuntimeException("Email  " + entity.getEmail() + " is alredy in used");
        }
        userApp = null;
        if (!StringUtils.isEmpty(entity.getContact())) {
            userApp = userRepository.findByContact(entity.getContact().trim());
            if (userApp != null && !entity.getId().equalsIgnoreCase(userApp.getId()))
                throw new RuntimeException("Contact  " + entity.getContact() + " is alredy in used");
        }
        userApp = null;
        if (!StringUtils.isEmpty(entity.getCin())) {
            entity.setCin(entity.getCin().trim());
            userApp = userRepository.findByContact(entity.getCin().trim());
            if (userApp != null && !entity.getId().equalsIgnoreCase(userApp.getId()))
                throw new RuntimeException("Email  " + entity.getContact() + " is alredy in used");
        }


        if (isNew) {
           if(StringUtils.isEmpty(entity.getPassword())) {
               throw new RuntimeException("Password requered");
           }
            entity.setPass(encodeText(entity.getPassword()));
            entity.setPassword(encodePassword(entity.getPassword()));
        } else {
                //TODO   Prise en charge le changement de mot de pass
        }
        if (StringUtils.isEmpty(entity.getPassword()))
            throw new RuntimeException("Password null");
        entity = userRepository.save(entity);
        if(isNew){
            this.authorizationService.addStandarUser(entity);
        }
        return entity;
    }

    public UserApp findByUsernamOrContactOrCinOrEmail(String login) {
        UserApp userApp = null;
        if (isValidPhoneNumber(login)) {
            userApp = userRepository.findByContact(cleanPhonNumber(login));
        }
        if (userApp == null)
            userApp = userRepository.findByUsername(login);
        if (userApp == null)
            userApp = userRepository.findByEmail(login);
        if (userApp == null)
            userApp = userRepository.findByCin(login);
        if (userApp == null) {
            if(userRepository.existsById(login))
               userApp = userRepository.getById(login);
        }
        if (userApp == null)
            return null;
        logger.info("Inding by login result " +(userApp==null?"Null ":userApp.getId()));
        return userApp;
    }



    public UserDetailsDeto findByUsername(String username) {
        Set<String> permissionNames = new HashSet<>();
        if (StringUtils.isEmpty(username))
            return null;
        UserApp userApp = findByUsernamOrContactOrCinOrEmail(username);
        if (userApp == null)
            return null;
        Set<String> roleApps = new HashSet<>();
        permissionNames =  authorizationService.buildAccessibilities(userApp);
        return new UserDetailsDeto(userApp.getId(),userApp.getUsername(), userApp.getPassword(),userApp.getFirstName(),userApp.getLastName(), userApp.getPhoto(),permissionNames);

    }
    public UserApp getConnected() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();

            // Récupérer l'utilisateur depuis le repository
            return userRepository.findByUsername(username);
        }
        return null;
    }
    public ResponseEntity<String> addPhoto(MultipartFile file , String userId) {
        if (!userRepository.existsById(userId))
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("User #"+userId+" non trouver");

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Le fichier est vide.");
        }
        try {
            String origineName = file.getOriginalFilename();
            String fileName = userId + ( origineName.lastIndexOf (".")>0 ?
                    origineName.substring (origineName.lastIndexOf (".")) :
                    "" );
            String uploadDir = StringUtils.isEmpty (configSystem.getProfileDirectories()) ?
                    KingaUtils.getDefaultMediaSpaceDirectory () :
                    configSystem.getProfileDirectories ();
            Files.createDirectories(Paths.get(uploadDir));
            Path filePath = Paths.get(uploadDir, fileName);
            Files.write(filePath, file.getBytes());
            UserApp userApp = userRepository.getById(userId);
            userApp.setPhoto(KingaUtils.encodeText(filePath.toString()));
            userRepository.save(userApp);
            return ResponseEntity.ok().body("Le fichier a été téléchargé avec succès : " + fileName);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Une erreur s'est produite lors du téléchargement du fichier.");
        }
    }
    public UserApp getAnonymeUser() {
        UserApp anonyme = userRepository.findByUsername("anonyme");
        if (anonyme != null) {
            return anonyme;
        }
        anonyme = new UserApp();
        anonyme.setUsername("anonyme");
        anonyme.setPassword("pass");
        anonyme.setPassword("pass");
        anonyme.setContact("0340000000");
        return save(anonyme);
    }

    public Map resetPasword(String phone) {
        Map<String,String> map = new HashMap<>();

        UserApp userApp = findByUsernamOrContactOrCinOrEmail(phone);
        if (userApp == null){
            map.put("result","fail");
            map.put("message","Phone not exist ");
            return map;
        }
        Double rendom = Math.random();
        Double code = ( 1 + rendom * 10000);
        userApp.setCode(code.intValue());
        userRepository.save(userApp);
        map.put("result","success");
        map.put("message","Code validation est envoyée a l'admin");
        return map;
    }
    public Map newPassword(Integer code, String phone, String password) {
        Map<String,String> map = new HashMap<>();

        UserApp userApp = findByUsernamOrContactOrCinOrEmail(phone);
        if (userApp == null){
            map.put("result","fail");
            map.put("message","Phone not exist ");
            return map;
        }
        int exist = userApp.getCode().intValue();
        if (code != exist){
            map.put("result","fail");
            map.put("message","Code invalid");
            return map;
        }
        userApp.setPassword(encodePassword(password));
        userApp.setPass(encodeText(password));
        userApp.setCode(null);
        userRepository.save(userApp);
        map.put("result","success");
        map.put("message","Pasword changed successfully");
        return map;
    }

    public Map verifyCode(String phone, Integer code) {
        Map<String,String> map = new HashMap<>();
        UserApp userApp = findByUsernamOrContactOrCinOrEmail(phone);
        if (userApp == null){
            map.put("result","fail");
            map.put("message","❌ Numero telephone non trouvé.");
            return map;
        }
        int exist = userApp.getCode().intValue();
        if (code != exist){
            map.put("result","fail");
            map.put("message","❌ Code incorrect.");
            return map;
        }

        map.put("result","success");
        map.put("message","✅ Code vérifié");
        return map;
    }

    /**
     * Longueur minimale d'un mot de passe défini par un administrateur.
     *
     * <p>Le contrôle vit ici et non dans le formulaire : un écran peut être
     * contourné, la règle doit tenir au niveau du service qui écrit en base.</p>
     */
    private static final int LONGUEUR_MIN_MOT_DE_PASSE = 6;

    /**
     * Définition du mot de passe d'un compte par un administrateur.
     *
     * <p>Distinct de {@link #changePassword(String, String, String)} : le mot de
     * passe actuel n'est pas demandé, et pour cause — un administrateur ne le
     * connaît pas. C'est précisément ce qui rend cette opération sensible, d'où
     * son autorisation vérifiée par l'appelant ({@code AutController}) et sa
     * trace dans le journal.</p>
     *
     * <p>La copie réversible du mot de passe ({@code pass}) est effacée plutôt
     * que réécrite : rien ne la lit dans l'application, et laisser en base de
     * quoi retrouver un mot de passe en clair n'a aucune contrepartie.</p>
     *
     * @param administrateur identifiant de l'auteur de l'opération, pour le
     *                       journal — savoir qu'un mot de passe a changé ne sert
     *                       à rien si l'on ne sait pas qui l'a changé
     * @throws IllegalStateException    compte inconnu
     * @throws IllegalArgumentException mot de passe trop court
     */
    public void definirMotDePasse(String id, String nouveauMotDePasse, String administrateur) {
        UserApp user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));

        String motDePasse = nouveauMotDePasse == null ? "" : nouveauMotDePasse.trim();
        if (motDePasse.length() < LONGUEUR_MIN_MOT_DE_PASSE) {
            throw new IllegalArgumentException(
                    "Le mot de passe doit compter au moins " + LONGUEUR_MIN_MOT_DE_PASSE + " caractères");
        }

        user.setPassword(encodePassword(motDePasse));
        user.setPass(null);
        // Un code de réinitialisation resté en attente permettrait encore de
        // changer ce mot de passe par la voie « mot de passe oublié ».
        user.setCode(null);
        userRepository.save(user);

        logger.info("Mot de passe du compte {} redéfini par {}", user.getUsername(), administrateur);
    }

    public void changePassword(String id, String currentPassword, String newPassword) {

        UserApp user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));


        if (!matchesPassword(currentPassword,user.getPassword())) {
            throw new RuntimeException("Mot de passe actuel incorrect");
        }

        String newPasswordEncoded = encodePassword(newPassword);
        user.setPassword(newPasswordEncoded);
        user.setPass(encodeText(newPassword));
        userRepository.save(user);
    }
}
