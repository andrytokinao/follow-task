package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;

@Entity
@DiscriminatorValue("CUSTOM_FIELD")
public class ActionCustomField extends ActionItem {
    @ManyToOne
    private CustomFieldValue customFieldValue;
}
