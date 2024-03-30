package com.kinga.tasksservice.service;

import com.kinga.tasksservice.dto.ValueDto;
import com.kinga.tasksservice.entity.*;
import com.kinga.tasksservice.repository.CustomFieldRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.io.IOException;
import java.text.ParseException;
import java.util.List;

@Service
public class ParameService {
    @Autowired
    private UserService userService;
    @Autowired
    private IssueService issueService ;
    @Autowired
    public CustomFieldRepository customFieldRepository;
    public Issue initialiseData() throws ParseException, ClassNotFoundException, InstantiationException, IllegalAccessException, IOException {
        // Initialiser status

        if (CollectionUtils.isEmpty(userService.findAll())) {
            UserApp u1 = new UserApp();
            u1.setFirstName("Jean");
            u1.setLastName("Dupont");
            u1.setPassword("123");
            u1.setPhoto("/assets/user1.jpeg");
            u1.setContact("0325698745");
            UserApp u2 = new UserApp();
            u2.setFirstName("Marie");
            u2.setPassword("123");
            u2.setLastName("Dubois");
            u2.setContact("0345698756");
            u2.setPhoto("/assets/user2.jpeg");
            userService.save(u1);
            userService.save(u2);
        }

        Issue issue = new Issue();
        issue.setSummary("Etude ");
        issue.setDescription("Voici quelque description");
        issueService.save(issue);

        // Test date value
        CustomField dateField = new CustomField();
        dateField.setType(TypeField.DateValue.getType());
        dateField.setName("Date livraison");
        dateField = customFieldRepository.save(dateField);
        ValueDto dateValue = new ValueDto();
        dateValue.setDate("2024-01-01");
        dateValue.setCustomField(dateField);
        dateValue.setIssue(issue);
        try {
            issueService.saveValue(dateValue);

        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        // Test user value
        CustomField userField = new CustomField();
        userField.setType(TypeField.UserValue.getType());
        userField.setName("Controlleur");
        userField = customFieldRepository.save(userField);
        UserApp userApp = new UserApp();
        userApp.setFirstName("Baptiste");
        userApp.setLastName("Jean  ");
        userApp.setPassword("123");
        userApp = userService.save(userApp);
        ValueDto userValue = new ValueDto();
        userValue.setUser(userApp);
        userValue.setCustomField(userField);
        userValue.setIssue(issue);
        issueService.saveValue(userValue);
        // Test String value
        CustomField stringField = new CustomField();
        stringField.setType(TypeField.StringValue.getType());
        stringField.setName("Code ");
        stringField = customFieldRepository.save(stringField);
        ValueDto stringValue = new ValueDto();
        stringValue.setString("FRES25133");
        stringValue.setCustomField(stringField);
        stringValue.setIssue(issue);
        issueService.saveValue(stringValue);

        // Test numeric value
        CustomField numericField = new CustomField();
        numericField.setType(TypeField.NumberValue.getType());
        numericField.setName(" numeric field test");
        numericField = customFieldRepository.save(numericField);
        ValueDto numericValue = new ValueDto();
        numericValue.setNumeric(10000);
        numericValue.setIssue(issue);
        numericValue.setCustomField(numericField);
        List<CustomFieldValue> values = issueService.saveValue(numericValue);
        System.out.println("Value size =" + values.size());
        return issue;
    }
}
