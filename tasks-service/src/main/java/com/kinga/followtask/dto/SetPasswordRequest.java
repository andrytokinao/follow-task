package com.kinga.followtask.dto;

import lombok.Data;

/**
 * Mot de passe défini par un administrateur sur le compte d'un tiers.
 *
 * Pas de {@code currentPassword}, contrairement à {@link ChangePasswordRequest} :
 * un administrateur ne connaît pas le mot de passe de la personne. C'est ce qui
 * distingue les deux opérations, et pourquoi celle-ci demande une autorisation.
 */
@Data
public class SetPasswordRequest {
    private String newPassword;
}
