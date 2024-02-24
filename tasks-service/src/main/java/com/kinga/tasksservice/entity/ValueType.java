package com.kinga.tasksservice.entity;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;

public enum ValueType {
    DATE {
        DateFormat dateFormat = new SimpleDateFormat("dd-MM-yyyy HH:mm:ss");

        @Override
        public Object toObject(String value) throws ParseException {
            return dateFormat.parse(value);

        }

        @Override
        public String toString(Object value) throws Exception {
            return dateFormat.format(value);
        }
    },
    NUMBER {
        @Override
        public Object toObject(String value) throws Exception {
            return Double.parseDouble(value);
        }

        @Override
        public String toString(Object value) throws Exception {
            return value.toString();
        }
    },
    STRING {
        @Override
        public Object toObject(String value) throws Exception {
            return value;
        }

        @Override
        public String toString(Object value) throws Exception {
            return (String) value;
        }
    },
    USER {
        @Override
        public Object toObject(String value) throws Exception {
            UserApp userApp = null;
            if (value != null) {
                userApp = new UserApp();
                userApp.setUsername(value);
            }
            return userApp;
        }

        @Override
        public String toString(Object value) throws Exception {
            if (!(value instanceof UserApp))
                throw new RuntimeException("Valus is not user ");
            UserApp userApp = (UserApp) value;
            return userApp.getUsername();
        }
    };

    public abstract Object toObject(String value) throws Exception;

    public abstract String toString(Object value) throws Exception;
}
