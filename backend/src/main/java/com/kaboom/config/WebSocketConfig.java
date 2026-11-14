package com.kaboom.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Enables STOMP-over-WebSocket (with a SockJS fallback for restrictive school networks).
 *
 * All state-changing actions (create room, join, answer, reveal, next) go through the plain
 * REST endpoints in RoomRestController — the WebSocket side is push-only:
 *
 *  - Client SUBSCRIBEs to /topic/rooms/{code} and receives a fresh StateBroadcast
 *    every time anything in that room changes.
 *
 * This keeps the client simple (no request/response correlation over the socket) while still
 * giving everyone in the room live updates.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins.split(","))
                .withSockJS();
    }
}
