package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

/**
 * Commentaire porté par l'entité Comment, via la mutation addComment.
 *
 * Attention : ce n'est pas le chemin des commentaires de la fiche de tâche.
 * Ceux-là sont des Document de type COMMENT_FILES et passent par
 * {@link ActionDocument}. Les deux coexistent.
 *
 * Les assignés passent par generateUserToNotifySpecific et non par la liste
 * des observateurs : ce sont eux que le commentaire concerne en premier, et ce
 * canal les atteint même quand observerIds est vide.
 */
@Entity
@DiscriminatorValue("COMMENT")
@Data
@NoArgsConstructor
public class ActionComment extends ActionItem {
    @ManyToOne
    private Document document;
    @ManyToOne
    private Comment comment;

    @Override
    public String buildMDetails() {
        return buildMDetails(null);
    }

    /**
     * « Andry a commenté la sous-tâche PRJ-12 · Corriger la connexion, qui vous
     * est assignée : « le correctif est en ligne » ».
     *
     * L'extrait évite d'avoir à ouvrir la tâche pour savoir s'il s'agit d'une
     * question à traiter ou d'une simple remarque.
     */
    @Override
    public String buildMDetails(String userIdToNotify) {
        if (this.issue == null) {
            return "";
        }
        String qualificatif = estAssigne(userIdToNotify) ? ", qui vous est assignée" : "";
        String debut = auteur() + " a commenté " + natureTache() + " " + tache() + qualificatif;
        String extrait = extrait();
        return extrait.isEmpty() ? debut : debut + " : « " + extrait + " »";
    }

    @Override
    public String buildTitle() {
        return "Nouveau commentaire";
    }

    /** Les observateurs : le destinataire assigné, lui, est traité à part. */
    @Override
    public Set<String> generateUserToNotify() {
        return issue == null ? new HashSet<>() : issue.getObserverIds();
    }

    @Override
    public Set<String> generateUserToNotifySpecific() {
        return assigneIds();
    }

    private String extrait() {
        return extrait(comment == null ? null : comment.getText());
    }
}
