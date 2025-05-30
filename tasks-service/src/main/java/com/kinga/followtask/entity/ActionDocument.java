package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Entity
@DiscriminatorValue("DOCUMENT")
@Data
public class ActionDocument extends ActionItem {
    @ManyToOne
    private Document document;

    @Override
    public String buildMDetails() {
        return this.document.buildMessage();
    }

    @Override
    public Set<String> generateUserToNotify() {
        Set<String> member = document.buildMembers();
        return member;
    }
}
