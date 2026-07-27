package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.Data;
@Data
public class WhatsAppRawFile {
    private String messageId;
    private String de;
    private boolean deMoi;
    private String type;
    private String mimetype;
    private long tailleOctets;
    private String nomFichierOriginal;
    private String legende;
    private boolean aUneMiniature;

    @JsonDeserialize(using = WhatsAppTimestampDeserializer.class)
    private Long horodatage;

    private boolean telecharge;
    private String url;
}