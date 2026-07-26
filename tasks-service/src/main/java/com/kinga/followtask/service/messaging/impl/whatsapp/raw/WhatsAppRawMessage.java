package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import lombok.Data;

@Data
public class WhatsAppRawMessage {
    private String id;
    private String de;              // "moi" ou un jid ex: "133792794677373@lid"
    private String nomExpediteur;
    private boolean deMoi;
    private String texte;
    private String type;            // conversation, extendedTextMessage, imageMessage, videoMessage, protocolMessage, messageContextInfo...
    private WhatsAppRawMedia media;
    private long horodatage;        // epoch seconds "plat", différent du format Neo4j
    private String pushName;
}