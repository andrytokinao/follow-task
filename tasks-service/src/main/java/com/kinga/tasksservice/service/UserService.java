package com.kinga.tasksservice.service;


import com.kinga.tasksservice.config.ConfigSystem;
import com.kinga.tasksservice.dto.UserDetailsDeto;
import com.kinga.tasksservice.entity.UserApp;
import com.kinga.tasksservice.repository.GroupeUserRepository;
import com.kinga.tasksservice.repository.MemberGroupeRepository;
import com.kinga.tasksservice.repository.UserRepository;
import com.kinga.utils.KingaUtils;
import lombok.RequiredArgsConstructor;
import org.apache.catalina.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

import static com.kinga.utils.KingaUtils.*;


@Service
@RequiredArgsConstructor
public class UserService {

   private final UserRepository userRepository;
   private final MemberGroupeRepository memberGroupeRepository;
   private final GroupeUserRepository groupeUserRepository;
   private final AuthorizationService authorizationService;

   private final ConfigSystem  configSystem;
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);


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
        permissionNames =  authorizationService.getAccessibilities(userApp);
        return new UserDetailsDeto(userApp.getId(),userApp.getUsername(), userApp.getPassword(),userApp.getFirstName(),userApp.getLastName(), userApp.getPhoto(),permissionNames);

    }
    public ResponseEntity<String> addPhoto(MultipartFile file , String userId) {
        if (!userRepository.existsById(userId))
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("User #"+userId+" non trouver");

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Le fichier est vide.");
        }
        try {
            String fileName = file.getOriginalFilename();
            String uploadDir = configSystem.getProfileDirectories();
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
}
