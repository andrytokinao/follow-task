package com.kinga.tasksservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
public class Criteria {
    private String field;
    private String value;
    private String operator;
    private List<Criteria> sousCriteria;
    public static List<Criteria> findByField(List<Criteria> criterias , String field){
        if (CollectionUtils.isEmpty(criterias) || StringUtils.isEmpty(field))
            return new ArrayList<>();
        return criterias.stream().filter( filter-> field.equals(filter.getField()))
                .collect(Collectors.toList());
    }
}
