package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhatsAppSendRequest {
    private String to;   // numéro du destinataire
    private String txt;  // texte du message
}