package com.kinga.tasksservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.text.ParseException;
import java.util.Date;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "value_type", discriminatorType = DiscriminatorType.STRING)
@Data
@NoArgsConstructor
public abstract class CustomFieldValue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private CustomField customField;
    @ManyToOne
    private Issue issue;
    private Date date;
    private String string;
    @ManyToOne
    private UserApp user;
    private Integer numeric;
    public abstract CustomFieldValue setValue(Object value) throws ParseException;
    public abstract String getStrinValue() ;
    public abstract Object getObject() throws ParseException;
    public static CustomFieldValue getInstanceDate()  {
        String className =  "com.kinga.tasksservice.dto.DateCustomFieldValue";
        Class<CustomFieldValue> clazz = null;
        try {
            clazz = (Class<CustomFieldValue>) Class.forName(className);
        } catch (ClassNotFoundException e) {
            throw new RuntimeException(e);
        }
        try {
            return clazz.newInstance();
        } catch (InstantiationException e) {
            throw new RuntimeException(e);
        } catch (IllegalAccessException e) {
            throw new RuntimeException(e);
        }
    }
    public static CustomFieldValue getInstanceWith(TypeField typeField) throws ClassNotFoundException, InstantiationException, IllegalAccessException {
        String className =  "com.kinga.tasksservice.entity."+typeField.getName();
        Class<CustomFieldValue> clazz = (Class<CustomFieldValue>) Class.forName(className);
        return clazz.newInstance();
    }
    public static CustomFieldValue getInstanceWith(String type) throws ClassNotFoundException, InstantiationException, IllegalAccessException {
        TypeField typeField = TypeField.fromType(type);
        String className = "com.kinga.tasksservice.entity."+typeField.getName();
        Class<CustomFieldValue> clazz = (Class<CustomFieldValue>) Class.forName(className);
        return clazz.newInstance();
    }
}
