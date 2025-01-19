package com.kinga.followtask.entity;

import com.nimbusds.jose.shaded.gson.Gson;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Converter
public class MapToJsonConverter implements AttributeConverter<Map, String> {


    @Override
    public String convertToDatabaseColumn(Map map) {
        return (new Gson()).toJson(map);
    }

    @Override
    public Map convertToEntityAttribute(String map) {
        return (new Gson()).fromJson(map, HashMap.class);
    }
}
