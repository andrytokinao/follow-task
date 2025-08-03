package com.kinga.followtask.lincense.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Entity
@Data
public class LicenseInfo {
    enum LicenseType {
        TRIAL,
        MONTHLY,
        YEARLY,
        LIFETIME,
        PAY_PER_USE,
        STUDENT,
        FREE,
        CUSTOM
    }
    public enum LicenseStatus {
        /**
         * La licence est active et pleinement fonctionnelle.
         * L'utilisateur peut accéder à toutes les fonctionnalités autorisées par sa licence.
         */
        ACTIVE,

        /**
         * La licence a dépassé sa date de validité.
         * L'accès au logiciel est généralement restreint ou bloqué.
         */
        EXPIRED,

        /**
         * La licence a été suspendue temporairement.
         * Cela peut être dû à un problème de paiement, d'abus, ou autre situation bloquante temporaire.
         */
        SUSPENDED,

        /**
         * La licence a été révoquée de manière définitive.
         * Cela peut survenir en cas de fraude, violation des conditions d’utilisation ou décision administrative.
         */
        REVOKED,

        /**
         * La licence a été désactivée manuellement (par l'utilisateur ou un administrateur).
         * Elle peut être réactivée plus tard.
         */
        INACTIVE,

        /**
         * La licence a été créée mais n'est pas encore activée.
         * Elle attend une validation (paiement, email de confirmation, code d'activation, etc.).
         */
        PENDING_VALIDATION,

        /**
         * La licence a été bloquée automatiquement, souvent pour des raisons de sécurité.
         * Exemples : trop d'activations, tentative de piratage, incohérence de machine.
         */
        BLOCKED
    }
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String licenseKey;

    private LicenseType licenseType; // "mensuelle", "annuelle", "à vie", etc.

    private LocalDate startDate;
    private LocalDate endDate;

    private LicenseStatus status; // "active", "expirée", etc.

    private String userName;
    private String userEmail;
    private String machineId;

    private String paymentMethod;
    private double amountPaid;
    private String currency;

    private int allowedActivations;
    private int currentActivations;

    private LocalDate lastCheckedDate;

    @ElementCollection
    private List<String> enabledFeatures;

    // Getters et Setters...

    public boolean isExpired() {
        return endDate != null && endDate.isBefore(LocalDate.now());
    }

    public boolean isActive() {

      return this.status == LicenseStatus.ACTIVE;
    }

}

