package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@DiscriminatorValue("DOCUMENT")
@Data
@NoArgsConstructor
public class ActionDocument extends ActionItem {
    @ManyToOne
    private Document document;

    /**
     * Rattachée à une tâche, la pièce jointe se lit mieux avec la tâche : sans
     * elle le destinataire ne sait pas où retrouver le document.
     */
    @Override
    public String buildMDetails() {
        if (this.document == null) {
            return "";
        }
        String titre = document.getTitre() == null ? "" : document.getTitre().trim();
        String base = auteur() + " a ajouté le document" + (titre.isEmpty() ? "" : " « " + titre + " »");
        String tache = tache();
        return tache.isEmpty() ? base : base + " sur " + natureTache() + " " + tache;
    }

    @Override
    public String buildTitle() {
        return "Nouveau document";
    }

    @Override
    public Set<String> generateUserToNotify() {
        Set<String> member = document.buildMembers();
        return member;
    }

    @Override
    public Set<String> generateUserToNotifySpecific() {
        return new HashSet<>();
    }

    @Override
    public String buildMDetails(String userIdToNotify) {
        return this.buildMDetails();
    }

}
