package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Demande de rattachement d'un compte WhatsApp a un utilisateur.
 *
 * <p>C'est l'utilisateur qui envoie le code au numero du systeme, jamais
 * l'inverse : un compte WhatsApp qui ecrit le premier a des inconnus se fait
 * suspendre. Le code n'est donc pas un secret envoye a l'utilisateur, mais un
 * jeton qu'il rapporte lui-meme depuis son propre telephone — ce qui prouve
 * du meme coup qu'il controle le numero.</p>
 */
@Entity
@Table(name = "whatsapp_link_request", indexes = {
        @Index(name = "idx_whatsapp_link_code", columnList = "code", unique = true)
})
@Data
public class WhatsAppLinkRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_app_id")
    private UserApp userApp;

    /**
     * Code que l'utilisateur envoie depuis son WhatsApp. Unicite portee par
     * l'index nomme ci-dessus, pas par la colonne : une seule contrainte.
     */
    @Column(name = "code", nullable = false, length = 32)
    private String code;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Au dela, le code ne vaut plus rien et il faut en demander un autre. */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /** Renseigne des que le code a ete retrouve : une demande ne sert qu'une fois. */
    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;

    /** Identifiant WhatsApp (jid) depuis lequel le code est arrive. */
    @Column(name = "linked_jid")
    private String linkedJid;

    public boolean isPending(LocalDateTime now) {
        return consumedAt == null && now.isBefore(expiresAt);
    }
}
