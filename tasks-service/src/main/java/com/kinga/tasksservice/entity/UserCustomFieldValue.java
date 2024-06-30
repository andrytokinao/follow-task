package com.kinga.tasksservice.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("UserCustomFieldValue")

@NoArgsConstructor
@Data
public class UserCustomFieldValue extends CustomFieldValue {

    @Override
    public String getStrinValue() {
        return null;
    }

    @Override
    public CustomFieldValue setValue(Object value) {
        this.setUser((UserApp) value);
        return this;
    }
    @Override
    public Object getObject() {
        return this.getUser();
    }
}
