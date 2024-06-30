package com.kinga.tasksservice.entity.enumapp;


import com.kinga.tasksservice.entity.ConfigEntry;

import java.beans.IntrospectionException;
import java.beans.PropertyDescriptor;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

public enum TypeConfig {

    PROFILE_DIRECTORIES("MEDIA_DIRECTORIES", "mediaDirectory","Repertoire ou s'enregistre les photo des utilisateurs ","create-project/create"),
    INSTALLATION_DIRECTORIES("DATA_DIRECTORIES", "mediaDirectory","Repertoire qui s'enregistre tous les donnée utilisés de l'application , Attention La manipulation manuel e de reperoire peut entrainé le bon fonctionnement de l'application","installation-space"),
    WORK_DIRECTORIES("WORK_DIRECTORIES","workDirectory","Repertoire ou se place les dossé lié au travail ","media-space");

    String name;
    String attibute;
    String description ;
    String nextPath;
    TypeConfig(String name,String attibute, String description,String nextPath) {
        this.name = name;
        this.attibute = attibute;
        this.description = description;
        this.nextPath = nextPath;
    }
    public static ConfigEntry setValue(ConfigEntry configEntry, String t,String value) throws ClassNotFoundException, InstantiationException, IllegalAccessException, IntrospectionException, InvocationTargetException {
        TypeConfig typeConfig = null;
        for(TypeConfig type : TypeConfig.values()) {
            if(type.name.equalsIgnoreCase(t)){
                typeConfig = type;
            }
        }
        if(typeConfig == null)
            throw new RuntimeException("Type invalid");

        PropertyDescriptor propertyDescriptor = new PropertyDescriptor(typeConfig.attibute, ConfigEntry.class);
        Method setterMethod = propertyDescriptor.getWriteMethod();
        setterMethod.invoke(configEntry,value);
        configEntry.setInstalationState(typeConfig.nextPath);
        return configEntry;
    }
}
