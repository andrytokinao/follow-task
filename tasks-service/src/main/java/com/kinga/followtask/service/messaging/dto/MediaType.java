package com.kinga.followtask.service.messaging.dto;

public enum MediaType {
    TEXT,
    IMAGE,
    VIDEO,
    AUDIO,
    DOCUMENT,
    SYSTEM,   // messages techniques (protocolMessage, messageContextInfo, accusés...)
    UNKNOWN
}