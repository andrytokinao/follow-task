package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import lombok.Data;

@Data
public class WhatsAppRawFilesResponse {
    private boolean succes;
    private WhatsAppRawFilesData donnees;
}