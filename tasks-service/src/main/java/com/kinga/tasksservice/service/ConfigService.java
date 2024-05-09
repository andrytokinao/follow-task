package com.kinga.tasksservice.service;

import com.kinga.tasksservice.dto.ConfigBuilder;
import com.kinga.tasksservice.dto.ValueDto;
import com.kinga.tasksservice.entity.*;
import com.kinga.tasksservice.entity.enumapp.TypeConfig;
import com.kinga.tasksservice.repository.ConfigRepository;
import com.kinga.tasksservice.repository.CustomFieldRepository;
import com.kinga.tasksservice.repository.GroupeUserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.beans.IntrospectionException;
import java.beans.PropertyDescriptor;
import java.io.IOException;
import java.io.PrintWriter;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.ParseException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ConfigService {
    private List<String> installations = Arrays.asList("","create-user-admin","work-space","media-space","create-project/create","create-project/issue-type","create-project/work-flow","create-project/work-flow-status","create-project/complete","complete");
    private static final Logger logger = LoggerFactory.getLogger(ConfigService.class);
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
    public List<ConfigEntry> save(ConfigEntry configEntry){
      return Arrays.asList(configRepository.save(configEntry));
    }
    public ConfigEntry saveEntry(String type, String value, Long configId) throws ClassNotFoundException, InstantiationException, IllegalAccessException, IntrospectionException, InvocationTargetException {
        if (configId == null || !configRepository.existsById(configId) ) {
            throw new RuntimeException("id not valid");
        }
        ConfigEntry configEntry = configRepository.getById(configId);
        configEntry = TypeConfig.setValue(configEntry,type,value);
        return configRepository.save(configEntry);
     }
    public ConfigEntry getCurrentConfig() throws IOException {
        ConfigEntry configEntry = configRepository.getByActiveIs(true);
        if (configEntry != null)
            return configEntry;
        configEntry = new ConfigEntry();
        configEntry.setActive(true);
        configEntry.setCreation(new Date());
        String secrete =UUID.randomUUID().toString();
        Path baseDirectory = Paths.get( System.getProperty("user.home"), Project.BASE_DIRECTORY);
        if (!Files.exists(baseDirectory)) {
            Files.createDirectory(baseDirectory);
        }
        PrintWriter writer = new PrintWriter(baseDirectory.toString()+"/code-instalation.txt", "UTF-8");
        writer.println("code validation ="+secrete);
        writer.close();
        configEntry.setRepertoireCodeValidation(baseDirectory.toString()+"/code-instalation.txt");
        configEntry.setCodeValidation(secrete);
        return configRepository.save(configEntry);
    }
    // Create user ==> work-space
    public UserApp initUser(UserApp userApp) throws IOException {
        ConfigEntry configEntry = getCurrentConfig();
        String codeValidation = userApp.getCodeValidation();
        if (StringUtils.isEmpty(codeValidation)) {
            throw new RuntimeException("Code obligatoire ");
        }
        if (!codeValidation.equalsIgnoreCase(configEntry.getCodeValidation())) {
            throw new RuntimeException("Code code invalid ");
        }
        userApp = userService.save(userApp);
        authorizationService.addUserToAdminSystem(userApp);
        configEntry.setInstalationState("work-space");
        configRepository.save(configEntry);
        return userApp;
    }
    public String nextInstallation() {
        ConfigEntry configEntry = configRepository.getByActiveIs(true);
        String installation = configEntry.getInstalationState() == null ? "" : configEntry.getInstalationState();
        return installation;
    }
    public String currentInstallation(){
        ConfigEntry configEntry = configRepository.getByActiveIs(true);
        return configEntry.getInstalationState();
    }
}
