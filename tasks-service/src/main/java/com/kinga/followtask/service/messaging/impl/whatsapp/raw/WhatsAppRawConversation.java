package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import lombok.Data;

@Data
public class WhatsAppRawConversation {
    private String jid;
    private String nom;
    private boolean estGroupe;
    private String photo;
    private int nombreMessages;
    private int nonLus;
    private WhatsAppRawLastMessage dernierMessage;
}