package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import lombok.Data;

@Data
public class WhatsAppRawMedia {
    private boolean disponible;
    private boolean telecharge;
    private String url;
    private String mimetype;
}