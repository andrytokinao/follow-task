package com.kinga.tasksservice.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("User")
@NoArgsConstructor
@Data
public class UserValue extends Value {
    @ManyToOne
    private UserApp user;

    @Override
    public String getStrinValue() {
        return null;
    }

    @Override
    public Value setValue(Object value) {
        this.user =(UserApp) value;
        return this;
    }
    @Override
    public Object getObject() {
        return this.user;
    }
}
