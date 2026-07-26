package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import lombok.Data;

@Data
public class WhatsAppRawMessagesResponse {
    private boolean succes;
    private WhatsAppRawMessagesData donnees;
}