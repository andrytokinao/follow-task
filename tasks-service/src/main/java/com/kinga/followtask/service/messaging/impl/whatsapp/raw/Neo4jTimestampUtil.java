package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

public final class Neo4jTimestampUtil {

    private Neo4jTimestampUtil() {}

    public static LocalDateTime toLocalDateTime(WhatsAppRawTimestamp ts) {
        if (ts == null) return null;
        long epochSeconds = (ts.getHigh() << 32) | (ts.getLow() & 0xFFFFFFFFL);
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(epochSeconds), ZoneOffset.UTC);
    }
}