package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import lombok.Data;
import java.util.List;

@Data
public class WhatsAppRawMessagesData {
    private WhatsAppRawConversationRef conversation;
    private List<WhatsAppRawMessage> messages;
    private int total;
}