package com.kinga.followtask.entity;

import com.nimbusds.jose.shaded.gson.Gson;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.List;

@Converter
public class UploadedConverter implements AttributeConverter<List<Uploaded>, String> {


    @Override
    public String convertToDatabaseColumn(List<Uploaded> uploaded) {
        return (new Gson()).toJson(uploaded);
    }

    @Override
    public List<Uploaded> convertToEntityAttribute(String uploaded) {
        return (new Gson()).fromJson(uploaded, ArrayList.class);
    }
}
