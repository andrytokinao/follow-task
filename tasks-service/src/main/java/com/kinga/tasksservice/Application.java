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


    }

}
