package com.kinga.followtask.service;

import com.kinga.followtask.dto.ValueDto;
import com.kinga.followtask.entity.CustomFieldValue;
import com.kinga.followtask.entity.*;
import com.kinga.followtask.repository.CustomFieldRepository;
import com.kinga.followtask.repository.criteria.IssueSearchCriteria;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class IssueServiceTest {
    @Autowired
    IssueService issueService;
    @Autowired
    CustomFieldRepository customFieldRepository;
    @Autowired
    UserService userService;

    @Test
    void save() {
    }

    @Test
    void findAllIssue() {
    }

    @Test
    void findByAssigneId() {
    }

    @Test
    void allComment() {
    }

    @Test
    void addComment() {
    }

   // @Test
    void saveValue() {
        // Test date value
        CustomField dateField = new CustomField();
        dateField.setType(TypeField.DateValue.getType());
        dateField.setName("Date test");
        dateField = customFieldRepository.save(dateField);
        ValueDto dateValue = new ValueDto();
        dateValue.setDate("2024-01-01");
        dateValue.setCustomField(dateField);
        try {
             issueService.saveValue(dateValue);
            assert(true);
        }catch (Exception e) {
            assert(false);
        }

        // Test user value
        CustomField userField = new CustomField();
        userField.setType(TypeField.UserValue.getType());
        userField.setName("User field test");
        userField = customFieldRepository.save(userField);
        UserApp userApp = new UserApp();
        userApp.setFirstName("First name test ");
        userApp.setLastName("Last name test ");
        userApp = userService.save(userApp);
        ValueDto userValue = new ValueDto();
        userValue.setUser(userApp);
        userValue.setCustomField(userField);

        // Test String value
        CustomField stringField = new CustomField();
        stringField.setType(TypeField.StringValue.getType());
        stringField.setName("String field test ");
        stringField = customFieldRepository.save(stringField);


        // Test numeric value
        CustomField numericField = new CustomField();
        numericField.setType(TypeField.NumberValue.getType());
        numericField.setName(" numeric field test");
        numericField = customFieldRepository.save(numericField);

    }

    @Test
    void allCustomField() {
    }
/*
    @Test
*/
    void searchIssues() throws ParseException {
        IssueSearchCriteria iCriteria = new IssueSearchCriteria();
        DateFormat df = new SimpleDateFormat("yyyy-MM-dd");
        iCriteria.setProjectId(1l);
        Map<Long, Date> froms = new HashMap<>();
        Map<Long, Date> tos = new HashMap<>();
        tos.put(1l,df.parse("2025-01-01"));
        froms.put(1l,df.parse("2025-01-31"));
        iCriteria.setCustomFieldDateValueFrom(froms);
        iCriteria.setCustomFieldDateValueTo(tos);
        List<Issue> issues = issueService.searchIssues(iCriteria);
        assertNotNull(issues);
        assertNotEquals(0,issues.size());

    }

}
