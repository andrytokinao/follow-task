package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;

@Entity
@DiscriminatorValue("ASSIGN")
public class ActionAssigne extends ActionItem {
    @ManyToOne
    private UserApp assigne;
}
