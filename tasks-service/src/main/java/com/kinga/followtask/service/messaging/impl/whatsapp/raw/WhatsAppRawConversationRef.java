package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import lombok.Data;

@Data
public class WhatsAppRawConversationRef {
    private String jid;
    private String nom;
    private boolean estGroupe;
}