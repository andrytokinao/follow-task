package com.kinga.followtask.entity;

import jakarta.persistence.Convert;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;

import java.util.Map;

@Entity
@DiscriminatorValue("PROFILE")
public class ActionProfile extends ActionItem {
    @ManyToOne
    private UserApp profile;

}
