package com.kinga.tasksservice.service;

import com.kinga.tasksservice.dto.ValueDto;
import com.kinga.tasksservice.entity.CustomFieldValue;
import com.kinga.tasksservice.entity.*;
import com.kinga.tasksservice.repository.*;
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
    public ValueDeoRepository valueDeoRepository;
    @Autowired
    public CommentRepository commentRepository;
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
    public List<CustomFieldValue> saveValue(ValueDto v) throws ClassNotFoundException, InstantiationException, IllegalAccessException, ParseException {
        if(v.getCustomField() == null || StringUtils.isEmpty(v.getCustomField().getType()))
            throw new RuntimeException("Invalid valueNew ");
        CustomFieldValue value = CustomFieldValue.getInstanceWith(v.getCustomField().getType());
        value.setId(v.getId());
        value.setIssue(v.getIssue());
        value.setCustomField(v.getCustomField());
        if(value instanceof StringCustomFieldValue)
            value.setValue(v.getString());
        else if(value instanceof DateCustomFieldValue) {
            value.setValue(v.getDate());
        }
        else if(value instanceof UserCustomFieldValue)
            value.setValue(v.getUser());
        else if(value instanceof NumericCustomFieldValue)
            value.setValue(v.getNumeric());
        else if(value instanceof TextCustomFieldValue)
            value.setValue(v.getText());
        valueDeoRepository.save(value);
        return valueDeoRepository.findCustomFieldValueByIssueId(value.getIssue().getId());
    }
    public List<CustomField> allCustomField(Long id){
        return customFieldRepository.findAll();
    }
    public List<CustomFieldValue> getValues(Long id) {
        return valueDeoRepository.findCustomFieldValueByIssueId(id);
    }
}
