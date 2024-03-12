package com.kinga.tasksservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.text.ParseException;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "value_type", discriminatorType = DiscriminatorType.STRING)
@Data
@NoArgsConstructor
public abstract class Value {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    String date;
    private Integer numeric;
    @ManyToOne
    private UserApp user;
    @ManyToOne
    private CustomField customField;
    @ManyToOne
    private Issue issue;

    public abstract String getStrinValue() ;
    public abstract Value setValue(Object value) throws ParseException;
    public abstract Object getObject() throws ParseException;
    public static Value getInstanceWith(TypeField typeField) throws ClassNotFoundException, InstantiationException, IllegalAccessException {
        String className =  "com.kinga.tasksservice.entity."+typeField.getName();
        Class<Value> clazz = (Class<Value>) Class.forName(className);
        return clazz.newInstance();
    }
    public static Value getInstanceWith(String type) throws ClassNotFoundException, InstantiationException, IllegalAccessException {
        TypeField typeField = TypeField.fromType(type);
        String className = "com.kinga.tasksservice.entity."+typeField.getName();
        Class<Value> clazz = (Class<Value>) Class.forName(className);
        return clazz.newInstance();
    }
}
