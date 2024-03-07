package com.kinga.tasksservice.service;

import com.kinga.tasksservice.entity.Issue;
import com.kinga.tasksservice.entity.Status;
import com.kinga.tasksservice.repository.IssueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IssueService {
    @Autowired
    public IssueRepository issueRepository;
    @Autowired
    public StatusService statusService;
    public Issue save(Issue issue){
        if(issue.getStatus() == null){
            Status status = statusService.getById(1L);
            if(status != null)
                issue.setStatus(status);
        }
        return issueRepository.save(issue);
    }
    public List<Issue> findAllIssue(){
        return issueRepository.findAll();
    }
    public List<Issue> findByAssigneId(Long id){
        return issueRepository.findByAssigneId(id);
    }
}
