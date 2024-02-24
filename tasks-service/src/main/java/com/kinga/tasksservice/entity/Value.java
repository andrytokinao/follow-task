package com.kinga.tasksservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Value {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private ValueType valueType;
    private String value;
    @ManyToOne
    private CostumField costumField;
    public Object getValueObject() throws Exception {
        return valueType.toObject(this.value);
    }
    public void setValueObject(Object value) throws Exception {
        this.value = valueType.toString(value);
    }


}
