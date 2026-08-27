package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import com.kinga.followtask.service.messaging.dto.MediaType;

public final class WhatsAppTypeResolver {

    private WhatsAppTypeResolver() {}

    public static MediaType resolve(String waType) {
        if (waType == null) return MediaType.TEXT;
        return switch (waType) {
            case "conversation", "extendedTextMessage" -> MediaType.TEXT;
            case "imageMessage" -> MediaType.IMAGE;
            case "videoMessage" -> MediaType.VIDEO;
            case "audioMessage", "pttMessage" -> MediaType.AUDIO;
            case "documentMessage" -> MediaType.DOCUMENT;
            case "protocolMessage", "messageContextInfo" -> MediaType.SYSTEM;
            default -> MediaType.UNKNOWN;
        };
    }

    public static boolean isIgnorable(MediaType type) {
        // les messages "techniques" (accusés de suppression, contexte...) ne sont pas
        // des messages utilisateurs — on peut choisir de ne pas les persister
        return type == MediaType.SYSTEM;
    }
}