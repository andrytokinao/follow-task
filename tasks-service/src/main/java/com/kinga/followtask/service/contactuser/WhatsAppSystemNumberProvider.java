package com.kinga.followtask.service.contactuser;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Fournit le numéro WhatsApp du système, lu depuis le gateway (GET /api/whatsapp/statut).
 * Cache avec TTL ; en cas d'échec : dernier numéro connu, puis valeur de configuration.
 */
@Component
public class WhatsAppSystemNumberProvider {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppSystemNumberProvider.class);
    private static final Duration TTL = Duration.ofMinutes(10);

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record Statut(boolean connecte, Utilisateur utilisateur) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record Utilisateur(String numero) {}

    private record Cached(String numero, Instant at) {}

    private final AtomicReference<Cached> cache = new AtomicReference<>();
    private final RestClient client;
    private final String fallback;

    public WhatsAppSystemNumberProvider(
            @Value("${messaging.whatsapp.base-url}") String gatewayUrl,
            @Value("${messaging.whatsapp.system-number:}") String fallback) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Duration.ofSeconds(3).toMillis());
        factory.setReadTimeout((int) Duration.ofSeconds(5).toMillis());
        this.client = RestClient.builder()
                .baseUrl(gatewayUrl)
                .requestFactory(factory)
                .build();
        this.fallback = digits(fallback);
    }

    /** Numéro au format international sans "+" (ex. 261340568013). */
    public String get() {
        Cached c = cache.get();
        if (c != null && c.at().plus(TTL).isAfter(Instant.now())) {
            return c.numero();
        }
        return refresh(c);
    }

    private synchronized String refresh(Cached previous) {
        Cached c = cache.get();   // un autre thread a peut-être déjà rafraîchi
        if (c != null && c.at().plus(TTL).isAfter(Instant.now())) {
            return c.numero();
        }
        try {
            Statut s = client.get().uri("/api/whatsapp/statut").retrieve().body(Statut.class);
            String numero = (s != null && s.utilisateur() != null) ? digits(s.utilisateur().numero()) : "";
            if (!numero.isEmpty()) {
                cache.set(new Cached(numero, Instant.now()));
                return numero;
            }
            log.warn("Gateway WhatsApp sans numéro (connecte={})", s != null && s.connecte());
        } catch (Exception e) {
            log.warn("Lecture du numéro WhatsApp impossible : {}", e.getMessage());
        }
        if (previous != null) return previous.numero();
        if (!fallback.isEmpty()) return fallback;
        throw new IllegalStateException("Numéro WhatsApp du système indisponible");
    }

    private static String digits(String s) {
        return s == null ? "" : s.replaceAll("\\D", "");
    }
}