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

    @Override
    public void registerStompEndpoints(final StompEndpointRegistry registry) {
        String[] originsArray = allowedOrigins.toArray(new String[0]);
        registry.addEndpoint("/api/ws")
                .setAllowedOrigins(originsArray);

        registry.addEndpoint("/api/ws")
                .setAllowedOrigins(originsArray)
                .withSockJS()
                .setWebSocketEnabled(true);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
    }
}