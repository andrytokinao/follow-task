package com.kinga.followtask.service.outil;

import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.UserApp;

/**
 * Qui agit dans le menu Outils (DT-019), et depuis quel espace de travail.
 *
 * @param utilisateur  l'utilisateur connecte
 * @param espace       l'espace de travail ouvert
 * @param adminSysteme administrateur de l'application ({@code CAN_ACCESS_ALL})
 * @param adminEspace  administrateur de l'espace ouvert (role donnant {@code ADMIN})
 */
public record ContexteOutil(UserApp utilisateur, Project espace, boolean adminSysteme, boolean adminEspace) {
}
