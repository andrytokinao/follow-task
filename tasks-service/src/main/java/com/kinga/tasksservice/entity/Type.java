package com.kinga.tasksservice.entity;

import lombok.Data;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
public enum Type {
    StringValue("String","StringValue"),
    DateValue("Date","DateValue"),
    NumberValue("Number","NumberValue"),
    UserValue("User","UserValue");
    private String name;
    private  String type;

    Type(String type, String name){
        this.name = name;
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public static Type fromType(String type) {
        for (Type e : Type.values()) {
            if (e.getType().equals(type)) {
                return e;
            }
        }
        throw new IllegalArgumentException("Invalid value: " + type);
    }
}
