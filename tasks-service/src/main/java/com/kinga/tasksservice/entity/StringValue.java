package com.kinga.tasksservice.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("StringValue")
@NoArgsConstructor
@Data
public class StringValue extends Value {
    private String string;

    @Override
    public String getStrinValue() {
        return this.string;
    }

    @Override
    public Value setValue(Object value) {
        this.string = (String)value;
        return this;
    }
    @Override
    public Object getObject() {
        return string;
    }
}
