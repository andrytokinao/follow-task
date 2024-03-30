package com.kinga.tasksservice.service;


import com.kinga.tasksservice.config.ConfigAutorities;
import com.kinga.tasksservice.dto.UserDetailsDeto;
import com.kinga.tasksservice.entity.UserApp;
import com.kinga.tasksservice.repository.UserRepository;
import com.kinga.utils.KingaUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

import static com.kinga.utils.KingaUtils.*;


@Service
public class UserService {
    @Autowired
    UserRepository userRepository;

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

        if (!StringUtils.isEmpty(entity.getUsername())) {
            UserApp userApp = userRepository.findByUsername(entity.getUsername());
            if (userApp != null && ((entity.getId() == userApp.getId())))
                throw new RuntimeException("Usename " + entity.getUsername() + " is alredy in used");
        } else {
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
        if (!StringUtils.isEmpty(entity.getEmail())) {
            userApp = userRepository.findByEmail(entity.getEmail().trim());
            if (userApp != null && !(entity.getId() ==userApp.getId()))
                throw new RuntimeException("Email  " + entity.getEmail() + " is alredy in used");
        }
        userApp = null;
        if (!StringUtils.isEmpty(entity.getContact())) {
            userApp = userRepository.findByContact(entity.getContact().trim());
            if (userApp != null && (isNew))
                throw new RuntimeException("Contact  " + entity.getContact() + " is alredy in used");
        }
        userApp = null;
        if (!StringUtils.isEmpty(entity.getCin())) {
            entity.setCin(entity.getCin().trim());
            userApp = userRepository.findByContact(entity.getCin().trim());
            if (userApp != null && isNew)
                throw new RuntimeException("Email  " + entity.getContact() + " is alredy in used");
        }


        if (isNew) {
           if(StringUtils.isEmpty(entity.getPassword())) {
               throw new RuntimeException("Password requered");
           }
            entity.setPassword(encodePassword(entity.getPassword()));
            entity.setPass(encodeText(entity.getPassword()));
        } else {
            if (!StringUtils.isEmpty(entity.getPass())) {
                //TODO   Prise en charge le changement de mot de pass
                entity.setPassword(encodePassword(entity.getPass()));
            }
        }
        return userRepository.save(entity);

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
        if (CollectionUtils.isEmpty(roleApps))
            return new UserDetailsDeto(userApp.getId(),userApp.getUsername(), userApp.getPassword(),userApp.getFirstName(),userApp.getLastName(), userApp.getPhoto(),permissionNames);

        permissionNames = roleApps.stream()
                .flatMap(roleApp -> (ConfigAutorities.getAutorities(roleApp).stream()))
                .collect(Collectors.toSet());
        return new UserDetailsDeto(userApp.getId(),userApp.getUsername(), userApp.getPassword(),userApp.getFirstName(),userApp.getLastName(), userApp.getPhoto(),permissionNames);
    }

    public Set<String> getAutorities(String username) {
        UserApp userApp = userRepository.findByUsername(username);
        if (userApp == null)
            return new HashSet<>();
        Set<String> roleApps = new HashSet<>();
        if (CollectionUtils.isEmpty(roleApps))
            return new HashSet<>();
        return roleApps.stream()
                .flatMap(roleApp -> (ConfigAutorities.getAutorities(roleApp).stream()))
                .collect(Collectors.toSet());
    }
}
