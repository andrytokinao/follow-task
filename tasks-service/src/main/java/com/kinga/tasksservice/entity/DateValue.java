package com.kinga.tasksservice.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Transient;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.scheduling.support.SimpleTriggerContext;

import java.sql.Date;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;


@Entity
@DiscriminatorValue("DateValue")
@NoArgsConstructor
@Data
public class DateValue extends Value {
    Long id= 1L;
    private String date ;
    public static DateFormat sdf = new SimpleDateFormat("YYYY-MM-dd");
    public static DateFormat sdfH = new SimpleDateFormat("YYYY-MM-dd hh:mm");
    @Override
    public String getStrinValue() {
        return sdf.format(this.date);
    }

    @Override
    public Value setValue(Object value) throws ParseException {
        if(value instanceof String) {
            this.setDate((String)value);
        }
       return this;
    }
    @Override
    public Object getObject() throws ParseException {
        return sdf.format(this.date);
    }
}
