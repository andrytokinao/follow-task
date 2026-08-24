package com.kinga.followtask.service.messaging.scheduler;

import com.kinga.followtask.entity.TypeCanal;
import com.kinga.followtask.service.messaging.MessagingServiceRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MessagingSyncScheduler {

    private final MessagingServiceRegistry registry;

    @Scheduled(fixedDelayString = "${messaging.sync.interval-ms:300000}")
    public void syncAllProviders() {
        for (TypeCanal type : TypeCanal.values()) {
            try {
                registry.get(type).syncAll();
            } catch (Exception e) {
                log.error("Échec sync globale pour le provider {} : {}", type, e.getMessage(), e);
            }
        }
    }
}