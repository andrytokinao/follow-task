package com.kinga.followtask.entity.enumapp;

public enum MotifLien {

    DECISION("Le message contient une décision liée au document"),
    MODIFICATION_DEMANDEE("Le message exprime une demande de modification sur le document"),
    VALIDATION("Le message valide ou approuve le contenu du document"),
    REFERENCE("Le message fait simplement référence au document, pour contexte"),
    AUTRE("Motif non catégorisé");

    private final String description;

    MotifLien(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}