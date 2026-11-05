package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;

@JsonIgnoreProperties(ignoreUnknown = true)
public record WhatsAppGatewayEvent(
        String event,
        Data data,
        Instant sentAt
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Data(
            Long id,
            String expediteur,
            String role,
            String contenu,
            @JsonProperty("cree_le") Instant creeLe
    ) {}
}