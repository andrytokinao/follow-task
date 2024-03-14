package com.kinga.tasksservice.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;


@Entity
@DiscriminatorValue("DateCustomFieldValue")
@NoArgsConstructor
@Data
public class DateCustomFieldValue extends CustomFieldValue {
    public static DateFormat sdf = new SimpleDateFormat("YYYY-MM-dd");
    public static DateFormat sdfH = new SimpleDateFormat("YYYY-MM-dd hh:mm");
    @Override
    public String getStrinValue() {
        return sdf.format(this.getDate());
    }

    @Override
    public CustomFieldValue setValue(Object value) throws ParseException {
        if(value instanceof Date) {
            this.setDate((Date)value);
        }else if(value instanceof  String)
            this.setDate(sdf.parse((String)value));
       return this;
    }
    @Override
    public Object getObject() throws ParseException {
        return this.getDate();
    }
}
