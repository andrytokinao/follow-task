package com.kinga.followtask.dto;

/**
 * Rappel affiche a la volee a un ouvrier dont le planning a des trous. Calcule a
 * chaque demande, jamais enregistre : il disparait des que le planning est rempli.
 *
 * @param cle     identifie le rappel pour que l'ecran ne le repete pas a chaque
 *                verification (ex. « VEILLE:2026-10-15 »)
 * @param gravite INFO, ATTENTION ou ALERTE
 */
public record RappelPlanning(String cle, Gravite gravite, String titre, String message) {

    public enum Gravite { INFO, ATTENTION, ALERTE }
}
