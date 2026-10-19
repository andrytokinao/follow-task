package com.kinga.followtask.dto;

/**
 * Espace de travail vu du cockpit de direction : le « département ».
 *
 * @param nom     nom affiché, et clé des filtres {@code departement}
 *                ({@code DirectionService.nomDepartement})
 * @param prefixe préfixe de l'espace, qui figure dans l'adresse
 *                ({@code /direction/TOPO})
 */
public record EspaceDirectionDTO(String nom, String prefixe) {
}
