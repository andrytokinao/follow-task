package com.kinga.tasksservice.web;

import com.kinga.tasksservice.dto.IssueInput;
import com.kinga.tasksservice.entity.Issue;
import com.kinga.tasksservice.entity.Status;
import com.kinga.tasksservice.service.IssueService;
import com.kinga.tasksservice.service.StatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class GQIssueController {
    @Autowired
    IssueService issueService;
    @Autowired
    StatusService statusService;
    @QueryMapping
    public List<Issue> allIssue(){
        return issueService.findAllIssue();
    }
    @QueryMapping
    public List<Issue> findIssueByUserId(@Argument Long id){
        return issueService.findByAssigneId(id);
    }
    @MutationMapping
    public Issue saveIssue(@Argument Issue issue){
        return issueService.save((Issue) issue);
    }
    @QueryMapping
    public List<Status> findAllStatus(){
        return statusService.findAll();
    }
}
