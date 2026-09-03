package com.kinga.followtask.dto.rapport;

/**
 * Statut d'une tâche dans un rapport de projet.
 *
 * Il est dérivé du pourcentage d'exécution et de l'état d'exécution de
 * l'événement de référence, et non de {@code Issue.getStatus()} : les statuts
 * configurables d'une demande sont propres à chaque workflow de projet, il
 * n'existe donc aucun mapping fiable vers un vocabulaire commun à tous les
 * rapports. Le statut du workflow reste affiché à côté, à titre de comparaison.
 */
public enum StatutTache {

    NON_DEMARRE("Non démarré", "statut-non-demarre"),
    EN_COURS("En cours", "statut-en-cours"),
    EN_RETARD("En retard", "statut-en-retard"),
    BLOQUE("Bloqué", "statut-bloque"),
    REPORTE("Reporté", "statut-reporte"),
    TERMINE("Terminé", "statut-termine");

    private final String libelle;
    private final String cssClass;

    StatutTache(String libelle, String cssClass) {
        this.libelle = libelle;
        this.cssClass = cssClass;
    }

    public String getLibelle() {
        return libelle;
    }

    /** Classe CSS du badge, partagée par le template Thymeleaf et le PDF. */
    public String getCssClass() {
        return cssClass;
    }
}
