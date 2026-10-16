package com.kinga.followtask.dto;

/**
 * Rappel affiche a la volee a un ouvrier dont le planning a des trous. Calcule a
 * chaque demande, jamais enregistre : il disparait des que le planning est rempli.
 *
 * @param cle        identifie le rappel pour que l'ecran ne le repete pas a chaque
 *                   verification (ex. « VEILLE:2026-10-15 »)
 * @param gravite    INFO, ATTENTION ou ALERTE
 * @param persistant vrai : l'ecran le garde affiche, sans bouton de fermeture,
 *                   tant que le serveur le renvoie (bandeau plutot que toast)
 */
public record RappelPlanning(String cle, Gravite gravite, String titre, String message, boolean persistant) {

    public enum Gravite { INFO, ATTENTION, ALERTE }

    /** Rappel ordinaire : un toast, que l'ouvrier peut fermer. */
    public RappelPlanning(String cle, Gravite gravite, String titre, String message) {
        this(cle, gravite, titre, message, false);
    }
}
