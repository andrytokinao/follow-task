package com.kinga.tasksservice.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

@Entity
@DiscriminatorValue("DateValue")
@NoArgsConstructor
@Data
public class DateValue extends Value {
    private Date date ;
    private DateFormat sdf = new SimpleDateFormat("yyyy/MM/dd  hh:mm");
    @Override
    public String getStrinValue() {
        return sdf.format(this.date);
    }

    @Override
    public Value setValue(Object value) {
        this.date = (Date) value;
        return this;
    }

    @Override
    public Object getObject() {
        return date;
    }

}
