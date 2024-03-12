package com.kinga.tasksservice.web;

import com.kinga.tasksservice.dto.IssueInput;
import com.kinga.tasksservice.dto.ValueDto;
import com.kinga.tasksservice.entity.Comment;
import com.kinga.tasksservice.entity.Issue;
import com.kinga.tasksservice.entity.Status;
import com.kinga.tasksservice.entity.Value;
import com.kinga.tasksservice.service.IssueService;
import com.kinga.tasksservice.service.StatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.text.ParseException;
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
    public List<Issue> findIssueByUserId(@Argument String id){
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
    // comment
    @MutationMapping
    public List<Comment> addComment(@Argument Comment comment){
        return issueService.addComment(comment);
    }
    @QueryMapping
    public List<Comment> allComment(@Argument Long issueId){
        return issueService.allComment(issueId);
    }
    @MutationMapping
    public List<Value> saveValue(@Argument ValueDto value) throws ParseException, ClassNotFoundException, InstantiationException, IllegalAccessException {
        return issueService.saveValue(value);
    }
    @QueryMapping
    public List<Value> allCustomField(@Argument Long id) {
        return issueService.allCustomField(id);
    }

}
