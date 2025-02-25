package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("GLOBAL")
public class GlobalSettings extends AppSettings {
    public GlobalSettings() {}

}

