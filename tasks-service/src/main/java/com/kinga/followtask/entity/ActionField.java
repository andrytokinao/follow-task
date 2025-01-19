package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("FIELD")
public class ActionField extends ActionItem {
    private String fieldName;
}
