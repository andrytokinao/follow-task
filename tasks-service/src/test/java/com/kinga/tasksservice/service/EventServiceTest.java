package com.kinga.tasksservice.service;

import com.kinga.followtask.Application;
import com.kinga.followtask.dto.ValueDto;
import com.kinga.followtask.entity.CustomField;
import com.kinga.followtask.entity.TypeField;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.CustomFieldRepository;
import com.kinga.followtask.service.IssueService;
import com.kinga.followtask.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@SpringBootTest(classes = Application.class)
@ExtendWith(SpringExtension.class)
@TestPropertySource(properties = "spring.liquibase.enabled=false")
class EventServiceTest {

}
