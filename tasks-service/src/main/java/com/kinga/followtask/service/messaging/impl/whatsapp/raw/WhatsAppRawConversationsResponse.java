package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import lombok.Data;
import java.util.List;

@Data
public class WhatsAppRawConversationsResponse {
    private boolean succes;
    private List<WhatsAppRawConversation> donnees;
    private int total;
}