package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import lombok.Data;

@Data
public class WhatsAppRawMember {
    private String jid;
    private String nom;
    private String numero;
    private String admin; // null = simple membre, "admin"/"superadmin" ou true selon le provider
}