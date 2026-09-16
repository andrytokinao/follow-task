package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.CollectionUtils;

import java.util.*;
import java.util.stream.Collectors;

@Entity
@Data
@NoArgsConstructor
public class ActionGroupe {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    @OneToMany (mappedBy = "actionGroupe")
    private List<ActionItem> actions;
    @ManyToOne
    private UserApp user;
    @ManyToOne
    private Issue issue;
    private Date created;
    @OneToMany(mappedBy = "action")
    private List<Notification> notifications;
    /**
     * Un groupe peut porter plusieurs actions (changer le statut et réassigner
     * d'un même geste). On les sépare au lieu de les coller bout à bout, sinon
     * le message final n'est plus lisible.
     */
    public String buildMessage(String userIdToNotify) {
        if (CollectionUtils.isEmpty(this.actions)) {
            return "";
        }
        return this.actions.stream()
                .map(action -> action.buildMDetails(userIdToNotify))
                .filter(detail -> detail != null && !detail.isBlank())
                .collect(Collectors.joining(" — "));
    }

    /** Titre de la première action du groupe : c'est elle qui l'a déclenché. */
    public String buildTitle() {
        if (CollectionUtils.isEmpty(this.actions)) {
            return "Activité";
        }
        return this.actions.get(0).buildTitle();
    }

    /**
     * Le groupe notifie dès qu'une de ses actions le mérite. Un groupe qui
     * changerait le statut et réassignerait d'un même geste doit prévenir pour
     * l'affectation, même si le statut visé ne le justifie pas à lui seul.
     */
    public boolean doitNotifier(RegleNotification regle) {
        if (CollectionUtils.isEmpty(this.actions)) {
            return false;
        }
        return this.actions.stream().anyMatch(action -> action.doitNotifier(regle));
    }
    public Set<String> userToNotifies(){
        Set<String> list = new HashSet<>();
        if (CollectionUtils.isEmpty(this.actions)) {
            return list;
        }
        this.actions.forEach(action -> {
            Set<String> us = action.generateUserToNotify();
            if (CollectionUtils.isEmpty(us)) {
                return;
            }
            list.addAll(us);
        });
        return sansAuteur(list);
    }
    public Set<String> userSpecificToNotifies(){
        Set<String> list = new HashSet<>();
        if (CollectionUtils.isEmpty(this.actions)) {
            return list;
        }
        this.actions.forEach(action -> {
            Set<String> us = action.generateUserToNotifySpecific();
            if (CollectionUtils.isEmpty(us)) {
                return;
            }
            list.addAll(us);
        });
        return sansAuteur(list);
    }

    /**
     * On ne se notifie jamais soi-même. Les identifiants vides viennent de
     * champs observerIds mal renseignés : les laisser passer créerait des
     * notifications que personne ne peut lire.
     */
    private Set<String> sansAuteur(Set<String> candidats) {
        String auteurId = this.user == null ? null : this.user.getId();
        return candidats.stream()
                .filter(u -> u != null && !u.isBlank())
                .filter(u -> auteurId == null || !u.equalsIgnoreCase(auteurId))
                .collect(Collectors.toSet());
    }
}
