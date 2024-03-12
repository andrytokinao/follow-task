package com.kinga.tasksservice.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("NumericValue")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NumericValue extends Value {
    private Integer numeric;

    @Override
    public String getStrinValue() {
        return Integer.toBinaryString(this.numeric);
    }

    @Override
    public Value setValue( Object value ) {
       this.numeric = (Integer) value;
       return this;
    }

    @Override
    public Object getObject() {
        return this.numeric;
    }
}
