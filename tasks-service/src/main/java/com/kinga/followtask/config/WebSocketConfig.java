package com.kinga.followtask.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);
    @Value("${cors.allowed-origins}")
    private List<String> allowedOrigins;
    @Override
    public void configureMessageBroker(final MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    /**
     * Le préfixe « /api » n'est pas décoratif : c'est la seule façon d'être
     * joignable.
     *
     * GQUserController expose le repli SPA sur
     * {@code /{path:^(?!assets|api)[^\.]*}/**}. Ce mapping vit dans le
     * RequestMappingHandlerMapping (ordre 0), qui est consulté avant le
     * mapping SockJS (ordre 1) : tout chemin sans point et hors « assets » ou
     * « api » est donc renvoyé vers index.html, endpoint STOMP enregistré ou
     * non. Une requête sur /ws/info recevait ainsi la page HTML au lieu du
     * JSON SockJS, et la poignée de main n'aboutissait jamais.
     *
     * Enregistrer aussi /ws ne sert à rien — le repli SPA le mange avant. Le
     * client doit viser /api/ws, ce que fait messages.service.ts.
     */
    private static final String ENDPOINT = "/api/ws";

    @Override
    public void registerStompEndpoints(final StompEndpointRegistry registry) {
        String[] originsArray = allowedOrigins.toArray(new String[0]);

        // WebSocket natif d'abord, repli SockJS ensuite : un proxy ou un
        // pare-feu qui bloque la montée en WebSocket laisse en général passer
        // le transport de secours.
        registry.addEndpoint(ENDPOINT)
                .setAllowedOrigins(originsArray);

        registry.addEndpoint(ENDPOINT)
                .setAllowedOrigins(originsArray)
                .withSockJS()
                .setWebSocketEnabled(true);

        logger.info("Canal temps réel exposé sur {} (origines autorisées : {})",
                ENDPOINT, allowedOrigins);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
    }
}