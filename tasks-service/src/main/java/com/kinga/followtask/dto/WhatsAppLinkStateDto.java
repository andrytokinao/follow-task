package com.kinga.followtask.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Etat du rattachement WhatsApp d'un utilisateur, tel que son profil l'affiche.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhatsAppLinkStateDto {

    /** Un compte WhatsApp verifie est rattache. */
    private boolean linked;

    /** Numero (jid) rattache, quand il y en a un. */
    private String linkedValue;

    /** Nom affiche par WhatsApp pour ce compte. */
    private String linkedDisplayName;

    /** Code en attente d'envoi par l'utilisateur ; null s'il n'y en a pas. */
    private String pendingCode;

    /** Fin de validite du code en attente, au format ISO. */
    private String pendingExpiresAt;

    /** Numero du systeme auquel l'utilisateur doit ecrire. */
    private String serviceNumber;

    /** Duree de validite d'un code, en minutes, pour l'afficher au bon endroit. */
    private int codeValidityMinutes;
}
