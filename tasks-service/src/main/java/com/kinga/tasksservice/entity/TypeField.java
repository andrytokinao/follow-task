package com.kinga.tasksservice.entity;

public enum TypeField {
    StringValue("String","StringCustomFieldValue"),
    DateValue("Date","DateCustomFieldValue"),
    NumberValue("Number","NumericCustomFieldValue"),
    UserValue("User","UserCustomFieldValue");
    private String name;
    private  String type;

    TypeField(String type, String name){
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

    public static TypeField fromType(String type) {
        for (TypeField e : TypeField.values()) {
            if (e.getType().equals(type)) {
                return e;
            }
        }
        throw new IllegalArgumentException("Invalid value: " + type);
    }
}
