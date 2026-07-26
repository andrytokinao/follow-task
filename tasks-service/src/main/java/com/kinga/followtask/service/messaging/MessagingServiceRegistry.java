package com.kinga.followtask.service.messaging;

import com.kinga.followtask.entity.TypeCanal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
public class MessagingServiceRegistry {

    private final Map<TypeCanal, MessagingService> services;

    public MessagingServiceRegistry(List<MessagingService> implementations) {
        this.services = implementations.stream()
                .collect(Collectors.toMap(MessagingService::getType, Function.identity()));
        log.info("MessagingService enregistrés : {}", services.keySet());
    }

    public MessagingService get(TypeCanal type) {
        MessagingService service = services.get(type);
        if (service == null) {
            throw new IllegalArgumentException("Aucune implémentation MessagingService pour le type : " + type);
        }
        return service;
    }

    public boolean supports(TypeCanal type) {
        return services.containsKey(type);
    }
}