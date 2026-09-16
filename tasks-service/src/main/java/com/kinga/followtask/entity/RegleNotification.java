package com.kinga.followtask.entity;

/**
 * Ce que le domaine a besoin de savoir du réglage des notifications.
 *
 * L'interface est déclarée ici, avec les entités qui s'en servent, et non dans
 * la configuration qui l'implémente : c'est l'appelant qui définit son besoin.
 * Sans cela, {@link ActionItem} dépendrait du paquet config, et une entité
 * n'aurait plus aucune raison d'être testable sans contexte Spring.
 */
public interface RegleNotification {

    /**
     * Ce statut marque-t-il une fin de traitement digne d'une notification ?
     * Les statuts intermédiaires restent tracés, mais ne préviennent personne.
     */
    boolean estStatutFinal(Status status);
}
