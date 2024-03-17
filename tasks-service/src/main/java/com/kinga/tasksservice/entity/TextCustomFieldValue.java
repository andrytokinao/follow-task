package com.kinga.tasksservice.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("TextCustomFieldValue")
public class TextCustomFieldValue extends CustomFieldValue {

    @Override
    public String getStrinValue() {
        return this.getString();
    }

    @Override
    public CustomFieldValue setValue(Object value) {
        this.setText((String) value);
        return this;
    }
    @Override
    public Object getObject() {
        return this.getString();
    }
}
