package com.kinga.followtask.entity;

import com.kinga.followtask.service.messaging.MessagingService;

import java.util.List;


public enum TypeCanal {
    PROJECT,
    ISSUE,
    DEFAULT,
    WHATSAPP,
    FACEBOOK,
    TELEGRAM,
    INSTAGRAM;
    public static List<TypeCanal> getImplemented(){
        return List.of(TypeCanal.WHATSAPP);
    }
}