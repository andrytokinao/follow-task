package com.kinga.followtask.entity.converter;

import com.kinga.followtask.repository.criteria.IssueSearchCriteria;
import com.nimbusds.jose.shaded.gson.Gson;
import jakarta.persistence.AttributeConverter;

import java.util.Map;

public class IssueCriteriaCoverter implements AttributeConverter<IssueSearchCriteria, String> {
    @Override
    public String convertToDatabaseColumn(IssueSearchCriteria attribute) {
        return (new Gson()).toJson(attribute);
    }

    @Override
    public IssueSearchCriteria convertToEntityAttribute(String dbData) {
        return (new Gson()).fromJson(dbData,IssueSearchCriteria.class);
    }
}
