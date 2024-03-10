package com.kinga.tasksservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@DiscriminatorColumn(name="type", discriminatorType = DiscriminatorType.STRING)
@Inheritance(strategy = InheritanceType.SINGLE_TABLE )
public abstract class Value {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private CustomField customField;
    @ManyToOne
    private Issue issue;

    public abstract String getStrinValue() ;
    public abstract Value setValue(Object value) ;
    public abstract Object getObject();
    public static Value getInstanceWith(Type type) throws ClassNotFoundException, InstantiationException, IllegalAccessException {
        String className = type.getName();
        Class<Value> clazz = (Class<Value>) Class.forName(className);
        return clazz.newInstance();
    }
    public static Value getInstanceWith(String type) throws ClassNotFoundException, InstantiationException, IllegalAccessException {
        Class<Value> clazz = (Class<Value>) Class.forName(type);
        return clazz.newInstance();
    }




    }
