package com.kinga.followtask.entity.converter;

import com.kinga.followtask.entity.DocumentUsageType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Converter
public class TypeDocumentListConverter implements AttributeConverter<List<DocumentUsageType>, String> {
    @Override
    public String convertToDatabaseColumn(List<DocumentUsageType> list) {
        if (list == null || list.isEmpty()) {
            return "";
        }
        return list.stream().map(Enum::name).collect(Collectors.joining(";"));
    }

    @Override
    public List<DocumentUsageType> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return List.of();
        }
        return Arrays.stream(dbData.split(";")).map(DocumentUsageType::valueOf).collect(Collectors.toList());
    }
}