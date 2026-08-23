package com.kinga.followtask.service.messaging.dto;

public enum MediaType {
    TEXT,
    IMAGE,
    VIDEO,
    AUDIO,
    DOCUMENT,
    SYSTEM,   // messages techniques (protocolMessage, messageContextInfo, accusés...)
    UNKNOWN;

    public static MediaType fromString(String value) {
        if (value == null || value.isBlank()) {
            return UNKNOWN;
        }
        try {
            return MediaType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return UNKNOWN;
        }
    }
}