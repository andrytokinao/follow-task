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

    public String buildMessage(String userIdToNotify) {
        StringBuilder message = new StringBuilder();
        this.getActions().forEach(action -> {
            message.append(action.buildMDetails(userIdToNotify));
        });
        return message.toString();
    }
    public Set<String> userToNotifies(){
        Set<String> list = new HashSet<>();
        this.getActions().forEach(action -> {
            Set<String> us = action.generateUserToNotify();
            if (CollectionUtils.isEmpty(us)) {
                return;
            }
            list.addAll(us);
        });
        return list.stream().filter(u -> ! u.equalsIgnoreCase(user.getId())).collect(Collectors.toSet());
    }
    public Set<String> userSpecificToNotifies(){
        Set<String> list = new HashSet<>();
        this.getActions().forEach(action -> {
            Set<String> us = action.generateUserToNotifySpecific();
            if (CollectionUtils.isEmpty(us)) {
                return;
            }
            list.addAll(us);
        });
        return list.stream().filter(u -> ! u.equalsIgnoreCase(user.getId())).collect(Collectors.toSet());
    }
}
