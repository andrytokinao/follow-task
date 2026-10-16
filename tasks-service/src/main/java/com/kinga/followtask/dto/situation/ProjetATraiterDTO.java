package com.kinga.followtask.dto.situation;

/** Projet en cours qui a des taches en retard ou bloquees. */
public record ProjetATraiterDTO(Long id,
                                String cle,
                                String titre,
                                String departement,
                                String prefixeDepartement,
                                int avancement,
                                int tachesEnRetard,
                                int tachesBloquees) {
}
