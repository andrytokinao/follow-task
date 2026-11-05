package com.kinga.followtask.service.contactuser;

import java.time.LocalDateTime;

/** Réponse de génération : code affiché ("483 921"), expiration, lien wa.me pré-rempli. */
public record LinkCodeResponse(String code, LocalDateTime expiresAt, String waLink) {}