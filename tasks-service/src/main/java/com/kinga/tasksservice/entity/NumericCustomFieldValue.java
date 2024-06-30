package com.kinga.tasksservice.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;

@Entity
@DiscriminatorValue("NumericCustomFieldValue")
@Data
public class NumericCustomFieldValue extends CustomFieldValue {

    @Override
    public String getStrinValue() {
        return Integer.toBinaryString(this.getNumeric());
    }

    @Override
    public CustomFieldValue setValue(Object value ) {
       this.setNumeric((Integer) value);
       return this;
    }

    @Override
    public Object getObject() {
        return this.getNumeric();
    }
}
