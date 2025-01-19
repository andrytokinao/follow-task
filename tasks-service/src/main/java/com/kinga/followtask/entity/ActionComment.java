package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;

@Entity
@DiscriminatorValue("COMMENT")
public class ActionComment extends ActionItem {
    @ManyToOne
    private Document document;
}
