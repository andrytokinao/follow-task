package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.CollectionUtils;

import java.util.HashSet;
import java.util.Set;

/**
 * Pièce jointe ou commentaire déposé sur une tâche.
 *
 * Les deux passent par ici : dans l'interface, un commentaire est un Document
 * de type COMMENT_FILES dont le texte est porté par {@code description}.
 * L'entité Comment et ActionComment existent en parallèle mais ne servent
 * qu'aux écrans qui appellent la mutation addComment.
 */
@Entity
@DiscriminatorValue("DOCUMENT")
@Data
@NoArgsConstructor
public class ActionDocument extends ActionItem {
    @ManyToOne
    private Document document;

    private boolean estCommentaire() {
        return document != null && document.getTypeDocument() == TypeDocument.COMMENT_FILES;
    }

    /**
     * Un commentaire est annonce comme tel. Le presenter comme « Nouveau
     * document » obligeait a ouvrir la tache pour decouvrir qu'il s'agissait
     * d'une simple remarque.
     */
    @Override
    public String buildTitle() {
        return estCommentaire() ? "Nouveau commentaire" : "Nouveau document";
    }

    @Override
    public String buildMDetails() {
        return buildMDetails(null);
    }

    /**
     * « Andry a commenté la sous-tâche PRJ-12 · kjj, qui vous est assignée :
     * « le correctif est en ligne » ».
     *
     * L'extrait évite d'ouvrir la tâche pour savoir s'il s'agit d'une question
     * à traiter ou d'une remarque sans suite.
     */
    @Override
    public String buildMDetails(String userIdToNotify) {
        if (this.document == null) {
            return "";
        }
        String qualificatif = estAssigne(userIdToNotify) ? ", qui vous est assignée" : "";
        String tache = tache();
        String surLaTache = tache.isEmpty() ? "" : " " + natureTache() + " " + tache + qualificatif;

        if (estCommentaire()) {
            String texte = extrait(document.getDescription());
            String debut = auteur() + " a commenté" + (surLaTache.isEmpty() ? "" : surLaTache);
            return texte.isEmpty() ? debut : debut + " : « " + texte + " »";
        }
        String titre = document.getTitre() == null ? "" : document.getTitre().trim();
        return auteur() + " a ajouté le document"
                + (titre.isEmpty() ? "" : " « " + titre + " »")
                + (surLaTache.isEmpty() ? "" : " sur" + surLaTache);
    }

    /**
     * Les destinataires « diffus » : les membres du document quand il en a
     * (echanges), sinon les observateurs de la tache.
     *
     * L'issue est lue sur l'action et non sur le document : addDocumentAction
     * la recoit rechargee, alors que document.issues peut n'etre qu'une
     * reference partielle.
     */
    @Override
    public Set<String> generateUserToNotify() {
        Set<String> destinataires = new HashSet<>();
        if (document != null && !CollectionUtils.isEmpty(document.buildMembers())) {
            destinataires.addAll(document.buildMembers());
        }
        if (issue != null && !CollectionUtils.isEmpty(issue.getObserverIds())) {
            destinataires.addAll(issue.getObserverIds());
        }
        return destinataires;
    }

    /**
     * Les assignes, toujours prevenus. Ils passent par le canal « specifique »
     * et non par les observateurs parce que celui-ci les atteint meme quand
     * observerIds est vide — ce qui etait le cas des taches assignees avant
     * l'arrivee des memberships, et expliquait le silence complet sur les
     * commentaires.
     */
    @Override
    public Set<String> generateUserToNotifySpecific() {
        return assigneIds();
    }
}
