package com.kinga.followtask.entity;

import jakarta.persistence.Convert;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

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
    @Override
    public String buildMDetails(String userIdToNotify) {
        if (StringUtils.isEmpty(userIdToNotify))
            return this.buildMDetails();
        return actionGroupe.getUser().getFirstName() +" Change  "+ (userIdToNotify.equalsIgnoreCase(profile.getId())? "your profile":profile.getUsername()) ;

    }
    @Override
    public Set<String> generateUserToNotifySpecific() {
        return new HashSet<>();
    }
}
