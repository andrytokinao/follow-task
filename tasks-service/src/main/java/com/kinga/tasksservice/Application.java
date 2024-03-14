package com.kinga.tasksservice;

import com.kinga.tasksservice.dto.ValueDto;
import com.kinga.tasksservice.entity.CustomFieldValue;
import com.kinga.tasksservice.entity.*;
import com.kinga.tasksservice.repository.CustomFieldRepository;
import com.kinga.tasksservice.service.IssueService;
import com.kinga.tasksservice.service.StatusService;
import com.kinga.tasksservice.service.UserService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.util.CollectionUtils;

import java.text.ParseException;
import java.util.Date;
import java.util.List;

@SpringBootApplication
public class Application {

    public static void main(String[] args) throws ParseException, ClassNotFoundException, InstantiationException, IllegalAccessException {
        ConfigurableApplicationContext ctx = SpringApplication.run(Application.class, args);
        StatusService statusService = (StatusService) ctx.getBean(StatusService.class);
        IssueService issueService = (IssueService) ctx.getBean(IssueService.class);
        UserService userService = (UserService) ctx.getBean(UserService.class);
        CustomFieldRepository customFieldRepository = (CustomFieldRepository) ctx.getBean(CustomFieldRepository.class);
        // Initialiser status
        if (CollectionUtils.isEmpty(statusService.findAll())) {
            Status enAttete = new Status();
            enAttete.setDisplayName("En Attente");
            enAttete.setIconeFile("/assets/stendby.ico");
            statusService.save(enAttete);

            Status open = new Status();
            open.setDisplayName("Ouvert");
            open.setIconeFile("/assets/open.ico");
            statusService.save(open);

            Status progress = new Status();
            progress.setDisplayName("En Progression");
            progress.setIconeFile("progress.ido");
            statusService.save(progress);


            Status controle = new Status();
            controle.setDisplayName("A Controller ");
            controle.setIconeFile("/assets/controle.ico");
            statusService.save(controle);

            Status done = new Status();
            done.setDisplayName("Terminées ");
            done.setIconeFile("/assets/done.ico");
            statusService.save(done);
        }
        if (CollectionUtils.isEmpty(userService.findAll())) {
            UserApp u1 =  new UserApp();
            u1.setFirstName("Jean");
            u1.setLastName("Dupont");
            u1.setPhoto("/assets/user1.jpeg");
            u1.setContact("0325698745");
            UserApp u2 = new UserApp();
            u2.setFirstName("Marie");
            u2.setLastName("Dubois");
            u2.setContact("0345698756");
            u2.setPhoto("/assets/user2.jpeg");
            userService.save(u1);
            userService.save(u2);
        }
        //
/*
            Issue issue = new Issue();
            issue.setSummary("Test summary ");
            issue.setDescription(" Test de creation custom field ");
            issueService.save(issue);

            // Test date value
            CustomField dateField = new CustomField();
            dateField.setType(TypeField.DateValue.getType());
            dateField.setName("Date test");
            dateField = customFieldRepository.save(dateField);
            ValueDto dateValue = new ValueDto();
            dateValue.setDate("2024-01-01");
            dateValue.setCustomField(dateField);
            dateValue.setIssue(issue);
            try {
                issueService.saveValue(dateValue);

            }catch (Exception e) {
                throw  new RuntimeException(e);
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
            ValueDto userValue =  new ValueDto();
            userValue.setUser(userApp);
            userValue.setCustomField(userField);
            userValue.setIssue(issue);
            issueService.saveValue(userValue);
            // Test String value
            CustomField stringField = new CustomField();
            stringField.setType(TypeField.StringValue.getType());
            stringField.setName("String field test ");
            stringField = customFieldRepository.save(stringField);
            ValueDto stringValue = new ValueDto();
            stringValue.setString("Value de tring");
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
            System.out.println("Value size ="+values.size());*/

    }

}
