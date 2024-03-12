package com.kinga.tasksservice.service;

import com.kinga.tasksservice.dto.ValueDto;
import com.kinga.tasksservice.entity.*;
import com.kinga.tasksservice.repository.CommentRepository;
import com.kinga.tasksservice.repository.CustomFieldRepository;
import com.kinga.tasksservice.repository.IssueRepository;
import com.kinga.tasksservice.repository.ValueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.text.ParseException;
import java.util.List;

@Service
public class IssueService {
    @Autowired
    public IssueRepository issueRepository;
    @Autowired
    public CommentRepository commentRepository;
    @Autowired
    private ValueRepository valueRepository;
    @Autowired
    CustomFieldRepository customFieldRepository;
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
    public List<Issue> findByAssigneId(String id){
        return issueRepository.findByAssigneId(id);
    }

    public List<Comment> allComment(Long issueId) {
         return commentRepository.findByIssueId(issueId);
    }
    public List<Comment> addComment(Comment comment) {
       commentRepository.save(comment);
       return commentRepository.findByIssueId(comment.getIssue().getId());
    }
    public List<Value> saveValue(ValueDto v) throws ClassNotFoundException, InstantiationException, IllegalAccessException, ParseException {
        if(v.getCustomField() == null || StringUtils.isEmpty(v.getCustomField().getType()))
            throw new RuntimeException("Invalid value ");
        Value value = Value.getInstanceWith("Date");
        if(value instanceof StringValue)
            value.setValue(v.getString());
        else if(value instanceof  DateValue)
            value.setValue(v.getDate());
        else if(value instanceof UserValue)
            value.setValue(v.getUser());
        else if(value instanceof NumericValue)
            value.setValue(v.getNumeric());
        valueRepository.save(value);
        return valueRepository.findByIssueId(v.getIssue().getId());
    }
    public List<Value> allCustomField(Long id){
        /*return valueRepository.findByIssueId(id);*/
        return null;
    }
}
