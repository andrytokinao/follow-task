package com.kinga.tasksservice.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("StringCustomFieldValue")
public class StringCustomFieldValue extends CustomFieldValue {

    @Override
    public String getStrinValue() {
        return this.getString();
    }

    @Override
    public CustomFieldValue setValue(Object value) {
        this.setString((String) value);
        return this;
    }
    @Override
    public Object getObject() {
        return this.getString();
    }
}
