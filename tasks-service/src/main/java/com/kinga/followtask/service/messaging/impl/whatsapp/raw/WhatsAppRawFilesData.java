package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import lombok.Data;
import java.util.List;

@Data
public class WhatsAppRawFilesData {
    private WhatsAppRawConversationRef conversation;
    private List<WhatsAppRawFile> fichiers;
}