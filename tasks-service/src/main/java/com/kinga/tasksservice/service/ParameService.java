package com.kinga.tasksservice.service;

import com.kinga.tasksservice.dto.ValueDto;
import com.kinga.tasksservice.entity.*;
import com.kinga.tasksservice.repository.ConfigRepository;
import com.kinga.tasksservice.repository.CustomFieldRepository;
import com.kinga.tasksservice.repository.GroupeUserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.io.IOException;
import java.text.ParseException;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ParameService {
    private static final Logger logger = LoggerFactory.getLogger(ParameService.class);
    private final ConfigRepository configRepository;
    private final UserService userService;
    private final GroupeUserRepository groupeUserRepository;
    private final IssueService issueService ;
    public final CustomFieldRepository customFieldRepository;
    public final AuthorizationService authorizationService;

    private List<UserApp> initUser() throws ParseException, ClassNotFoundException, InstantiationException, IllegalAccessException, IOException {
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
            authorizationService.addUserToAdminSystem(u1);
        }
        return userService.findAll();
    }
    public Issue initalizeData() throws ParseException, ClassNotFoundException, InstantiationException, IllegalAccessException, IOException {
        List<ConfigEntry> configEntrys = configRepository.findByType("init-data");
        if (!CollectionUtils.isEmpty(configEntrys)) {
            ConfigEntry c = configEntrys.get(0);
            logger.info("Data is alredy initialize at "+c.getDeteEntry());
            return null;
        }
        ConfigEntry configEntry = new ConfigEntry();
        configEntry.setDeteEntry(new Date());
        configEntry.setVersion("test");
        configEntry.setType("init-data");
        configRepository.save(configEntry);

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


        UserApp userApp = null;
        List<UserApp> users = initUser();
        if (CollectionUtils.isEmpty(users)) {


        }
        userApp = users.get(0);
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
