package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import lombok.Data;

@Data
public class WhatsAppRawMembersResponse {
    private boolean succes;
    private WhatsAppRawMembersData donnees;
}