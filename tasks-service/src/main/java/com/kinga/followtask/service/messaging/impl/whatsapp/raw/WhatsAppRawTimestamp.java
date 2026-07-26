package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import lombok.Data;

@Data
public class WhatsAppRawTimestamp {
    private long low;
    private long high;
    private boolean unsigned;
}