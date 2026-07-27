package com.kinga.followtask.service.messaging.impl.whatsapp.raw;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;

/**
 * Le provider WhatsApp renvoie l'horodatage sous deux formats différents :
 *  - un nombre simple (epoch seconds) : 1785114455
 *  - un objet Neo4j-like : { "low": 1785046415, "high": 0, "unsigned": true }
 * Ce désérialiseur absorbe les deux et renvoie toujours un epoch seconds en Long.
 */
public class WhatsAppTimestampDeserializer extends JsonDeserializer<Long> {

    @Override
    public Long deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);

        if (node == null || node.isNull()) {
            return null;
        }

        if (node.isNumber()) {
            return node.asLong();
        }

        if (node.isObject()) {
            long low = node.has("low") ? node.get("low").asLong() : 0L;
            long high = node.has("high") ? node.get("high").asLong() : 0L;
            // reconstruction d'un long 64 bits ; en pratique high vaut quasi toujours 0
            return (high << 32) | (low & 0xFFFFFFFFL);
        }

        // format inattendu : on ne fait pas planter tout le flux pour un seul horodatage
        return null;
    }
}