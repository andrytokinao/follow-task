package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;

@Entity
@DiscriminatorValue("EVENT")
public class ActionEventApp extends ActionItem {
    @ManyToOne
    private Event event;
}
