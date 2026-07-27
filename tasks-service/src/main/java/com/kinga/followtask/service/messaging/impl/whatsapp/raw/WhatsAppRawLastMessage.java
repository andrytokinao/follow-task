package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.Data;

@Data
public class WhatsAppRawLastMessage {
    private String texte;

    @JsonDeserialize(using = WhatsAppTimestampDeserializer.class)
    private Long horodatage;

    private boolean deMoi;
}