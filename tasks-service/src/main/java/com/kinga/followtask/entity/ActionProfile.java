package com.kinga.followtask.entity;

import jakarta.persistence.Convert;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;

import java.util.*;

@Entity
@DiscriminatorValue("PROFILE")
public class ActionProfile extends ActionItem {
    @ManyToOne
    private UserApp profile;

    @Override
    public String buildMDetails() {
        return actionGroupe.getUser().getFirstName() +" Change profile "+profile.getUsername();
    }

    @Override
    public Set<String> generateUserToNotify() {
        return (new HashSet<>(Arrays.asList(profile.getUsername())));
    }
}
