package com.kinga.followtask.entity.enumapp;

// Enum pour le statut d'exécution
public enum ExecutionStatus {
    PENDING,       // En attente (pas encore commencé)
    IN_PROGRESS,   // En cours
    COMPLETED,     // Terminé avec succès
    BLOCKED,       // Bloqué (besoin d'aide / dépendance)
    POSTPONED,     // Reporté à plus tard
    EXTENDED       // Temps augmenté (prolongé)
 }
