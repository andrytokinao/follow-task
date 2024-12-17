package com.kinga.followtask.config;

import com.kinga.followtask.entity.EventType;
import com.kinga.followtask.repository.EventTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class Initializer implements CommandLineRunner {
    @Autowired
    private EventTypeRepository eventTypeRepository;

    @Override
    public void run(String... args) throws Exception {
        if (eventTypeRepository.count() == 0) {
            eventTypeRepository.save(new EventType("PERSONAL", "#FFB6C1", "background-color: #FFB6C1;"));
            eventTypeRepository.save(new EventType("MEETING", "#4682B4", "background-color: #4682B4;"));
            eventTypeRepository.save(new EventType("ISSUE", "#FFD700", "background-color: #FFD700;"));
            eventTypeRepository.save(new EventType("CONFERENCE", "#32CD32", "background-color: #32CD32;"));
            eventTypeRepository.save(new EventType("REMINDER", "#FF6347", "background-color: #FF6347;"));
            eventTypeRepository.save(new EventType("HOLIDAY", "#FFD700", "background-color: #FFD700;"));
            eventTypeRepository.save(new EventType("OTHER", "#D3D3D3", "background-color: #D3D3D3;"));

        }
    }
}
