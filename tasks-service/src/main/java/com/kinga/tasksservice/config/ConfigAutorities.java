package com.kinga.tasksservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.CollectionUtils;

import java.util.*;

import static com.kinga.tasksservice.config.Permission.*;
import static com.kinga.tasksservice.config.Roles.*;


public class ConfigAutorities {
    private static final Logger logger = LoggerFactory.getLogger(ConfigAutorities.class);
    private static Map<String, List<String>> roleToAutorities = new HashMap<>();

    static {
        List<String> aUser = Arrays.asList(LOGED, CAN_EDIT_PROFILE);
        List<String> aResponsable = new ArrayList<>(aUser);
        aResponsable.addAll(Arrays.asList(CAN_VIEW_LIST_USER, CAN_ADD_USER, CAN_CONTROLE_USER, CAN_ADD_PAROURS_USER, CAN_VIEW_COMPANY));
        List<String> aAdmin = new ArrayList<>(aResponsable);
        aAdmin.addAll(Arrays.asList( CAN_EDIT_PROJECT, CAN_AFFECT_ROLE_RESPONSABLE));
        List<String> aSupAdmin = new ArrayList<>(aAdmin);
        aSupAdmin.addAll(Arrays.asList(CAN_AFFECT_ROLE_RESPONSABLE,CAN_AFFECT_ROLE_ADMIN, CAN_VIEW_LIST_COMPANY));

        roleToAutorities.put(ROLE_USER, Collections.unmodifiableList(aUser)); // Use unmodifiableList to prevent modifications
        roleToAutorities.put(ROLE_RESPONSABLE, Collections.unmodifiableList(aResponsable));
        roleToAutorities.put(ROLE_ADMIN, Collections.unmodifiableList(aAdmin));
        roleToAutorities.put(ROLE_SUP_ADMIN, Collections.unmodifiableList(aSupAdmin));
    }


    public static List<String> getAutorities(String role) {
        return roleToAutorities.get(role);
    }
}
