package com.kinga.followtask.repository;

import com.kinga.followtask.entity.WhatsAppLinkRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WhatsAppLinkRequestRepository extends JpaRepository<WhatsAppLinkRequest, String> {

    /** Demande en cours d'un utilisateur : la plus recente non consommee. */
    Optional<WhatsAppLinkRequest> findFirstByUserAppIdAndConsumedAtIsNullOrderByCreatedAtDesc(String userAppId);

    /** Demandes encore valables, a confronter aux messages recus. */
    List<WhatsAppLinkRequest> findByConsumedAtIsNullAndExpiresAtAfter(LocalDateTime now);

    boolean existsByCode(String code);
}
