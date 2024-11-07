package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;


@Entity
@DiscriminatorValue("CheckBoxCustomFieldValue")
@NoArgsConstructor
@Data
public class CheckBoxCustomFieldValue extends CustomFieldValue {
     @Override
    public String getStrinValue() {
         return getValues ().toString ();
    }

    @Override
    public CustomFieldValue setValue(Object value) throws ParseException {
        if(value instanceof List) {
            this.setValues ((List)value);
        } else {
            throw new RuntimeException ("Invalid data ");
        }
       return this;
    }
    @Override
    public Object getObject() throws ParseException {
        return this.getDate();
    }
}
