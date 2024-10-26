package com.kinga.followtask.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private static final String SEPARATOR = ",";

    // Convertir la liste en une chaîne séparée par des virgules
    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        return attribute != null ? String.join(SEPARATOR, attribute) : null;
    }

    // Convertir la chaîne de la base en une liste
    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        return dbData != null ? Arrays.stream(dbData.split(SEPARATOR))
                .map(String::trim)
                .collect(Collectors.toList()) : null;
    }
}
