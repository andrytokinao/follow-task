package com.kinga.tasksservice.service;

import com.kinga.tasksservice.dto.ValueDto;
import com.kinga.tasksservice.entity.CustomFieldValue;
import com.kinga.tasksservice.entity.*;
import com.kinga.tasksservice.repository.CustomFieldRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;

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

    @Test
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

}
