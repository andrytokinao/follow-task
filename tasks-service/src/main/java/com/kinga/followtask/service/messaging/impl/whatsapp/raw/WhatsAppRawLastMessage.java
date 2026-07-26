package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import lombok.Data;

@Data
public class WhatsAppRawLastMessage {
    private String texte;
    private WhatsAppRawTimestamp horodatage;
    private boolean deMoi;
}