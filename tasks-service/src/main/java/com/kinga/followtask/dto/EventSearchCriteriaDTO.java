package com.kinga.followtask.dto;

import com.kinga.followtask.entity.CustomField;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
@Data
public class EventSearchCriteriaDTO {

    private List<String> userIds;
    private List<Long> issueIds;
    private List<Long> parrentIds;
    private List<Long> customFieldIds;
    private Long projectId;
    private LocalDateTime start;
    private LocalDateTime end;
    public EventSearchCriteriaDTO(){

    }
}
