package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import lombok.Data;
import java.util.List;

@Data
public class WhatsAppRawMembersData {
    private String jid;
    private String nom;
    private String description;
    private String proprietaire;
    private int nombreMembres;
    private List<WhatsAppRawMember> membres;
}