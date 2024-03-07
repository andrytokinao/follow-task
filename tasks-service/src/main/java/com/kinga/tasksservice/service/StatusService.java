package com.kinga.tasksservice.service;

import com.kinga.tasksservice.entity.Status;
import com.kinga.tasksservice.repository.StatusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StatusService {
    @Autowired
    public StatusRepository statusRepository;
    public Status save(Status status) {
        return statusRepository.save(status);
    }
    public List<Status> findAll(){
        return statusRepository.findAll();
    }
    public Status getById(Long id){
        return statusRepository.getReferenceById(id);
    }
}
