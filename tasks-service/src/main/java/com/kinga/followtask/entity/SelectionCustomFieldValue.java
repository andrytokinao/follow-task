package com.kinga.followtask.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;


@Entity
@DiscriminatorValue("SelectionCustomFieldValue")
@NoArgsConstructor
@Data
public class SelectionCustomFieldValue extends CustomFieldValue {

    @Override
    public String getStrinValue() {
       return getString ();
    }

    @Override
    public CustomFieldValue setValue(Object value) throws ParseException {
        if(value instanceof String) {
            this.setString ((String)value);
        }
       return this;
    }
    @Override
    public Object getObject() throws ParseException {
        return this.getDate();
    }
}
