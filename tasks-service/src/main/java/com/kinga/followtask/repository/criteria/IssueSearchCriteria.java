package com.kinga.followtask.repository.criteria;

import com.kinga.followtask.entity.enumapp.Niveau;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;
import java.util.Map;
@NoArgsConstructor
@AllArgsConstructor
@Data
public class IssueSearchCriteria {
    private String key;
    private String summary;
    private Date dateFrom;
    private Date dateTo;
    private List<Long> statusIds;
    private List<Long> issueTypeIds;
    private List<Niveau> issueTypeLevels;
    private List<String> assigneUsernames;
    private Map<Long, List<String>> customFieldStringValues;
    private Map<Long, List<Date>> customFieldDateValues;
    private Map<Long, Date> customFieldDateValueFrom;
    private Map<Long, Date> customFieldDateValueTo;
    private Map<Long, List<String>> customFieldUserIds;
    private Map<Long, List<Long>> customFieldIssueIds;
    private Map<Long, List<String>> customFieldTextValues;
    private Long projectId;
}
