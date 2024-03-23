package com.kinga.tasksservice.web;

import com.kinga.tasksservice.dto.Dossier;
import com.kinga.tasksservice.dto.Repertoire;
import com.kinga.tasksservice.dto.ValueDto;
import com.kinga.tasksservice.entity.*;
import com.kinga.tasksservice.service.IssueService;
import com.kinga.tasksservice.service.StatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.IOException;
import java.net.MalformedURLException;
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
    public Issue saveIssue(@Argument Issue issue) throws IOException {
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
    public List<CustomFieldValue> saveValue(@Argument ValueDto value) throws ParseException, ClassNotFoundException, InstantiationException, IllegalAccessException {
        return issueService.saveValue(value);
    }
    @QueryMapping
    public List<CustomFieldValue> getValues(@Argument Long issueId) throws ParseException, ClassNotFoundException, InstantiationException, IllegalAccessException {
        return issueService.getValues(issueId);
    }
    @QueryMapping
    public List<CustomField> allCustomField(@Argument Long id) {
        return issueService.allCustomField(id);
    }
    @GetMapping(path = "/api/load-directory")
    @ResponseBody
    public Repertoire loadDirectory(@RequestParam(required = true) Long issueId){
        return issueService.loadDirectory(issueId);
    }
    @GetMapping("/api/download")
    @ResponseBody
    public ResponseEntity<Resource> downloadFiles(@RequestParam List<String> fileNames, @RequestParam String directory) throws MalformedURLException {
        return issueService.downloadFiles(fileNames,directory);
    }
    }
