package com.kinga.tasksservice.web;

import com.kinga.tasksservice.dto.Criteria;
import com.kinga.tasksservice.dto.ValueDto;
import com.kinga.tasksservice.entity.*;
import com.kinga.tasksservice.service.AuthorizationService;
import com.kinga.tasksservice.service.ConfigService;
import com.kinga.tasksservice.service.IssueService;
import com.kinga.tasksservice.service.ProjectService;
import com.kinga.utils.KingaUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.ParseException;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class GQIssueController {
    @Autowired
    IssueService issueService;
    @Autowired
    ProjectService projectService;
    final AuthorizationService authorizationService;
    final ConfigService configService;
    @QueryMapping
    public List<Issue> allIssue(){
        return issueService.findAllIssue();
    }
    @QueryMapping
    public List<Issue> findIssueByUserId(@Argument String id){
        return issueService.findByAssigneId(id);
    }
    @MutationMapping
    public List<Issue> saveIssue(@Argument Issue issue) throws IOException {
        return issueService.saveIssue((Issue) issue);
    }
    @QueryMapping
    public List<Status> findAllStatus(){
        return projectService.findAll();
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
    public List<CustomField> allCustomFieldByIssue(@Argument Long id) {
        return issueService.allCustomField(id);
    }
    @QueryMapping
    public List<MemberGroupe> loadGroupeMember(@Argument String userId) {
        return authorizationService.loadGroupeMember(userId);
    }

    @GetMapping("/api/download")
    @ResponseBody
    public ResponseEntity<Resource> downloadFiles(@RequestParam List<String> fileNames, @RequestParam String directory) throws MalformedURLException {
        return issueService.downloadFiles(fileNames,directory);
    }
    @PostMapping("/api/upload")
    public ResponseEntity<String> uploadFile(@RequestPart("file") MultipartFile file,@RequestParam String directory) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Le fichier est vide.");
        }

        try {
            String fileName = file.getOriginalFilename();
            String uploadDir = KingaUtils.decodeText(directory);
            Files.createDirectories(Paths.get(uploadDir));
            Path filePath = Paths.get(uploadDir , fileName);
            Files.write(filePath, file.getBytes());

            return ResponseEntity.ok().body("Le fichier a été téléchargé avec succès : " + fileName);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Une erreur s'est produite lors du téléchargement du fichier.");
        }
    }
    @QueryMapping
    public List<Project> allProjects(){
       return projectService.allProjects();
    }
    @QueryMapping
    public Project getProject(@Argument String prefix){
        return projectService.getByPrefix(prefix);
    }
    @MutationMapping
    public Project createProjectOrSave(@Argument  Project project){
        return projectService.createProjectOrSave(project);
    }
    @MutationMapping
    public List<IssueType> saveIssueType(@Argument IssueType issueType){
        return projectService.saveIssueType(issueType);
    }
    @MutationMapping
    public WorkFlow affectWorkFlow(@Argument IssueType issueType){
        return projectService.affectWorkFlow(issueType);
    }
    @MutationMapping
    public WorkFlow addStatus(@Argument  Status status, @Argument  WorkFlow workFlow, @Argument Integer issueTypeId){
        return projectService.addStatus(status, workFlow, issueTypeId);
    }
    @QueryMapping
    public List<WorkFlow> allWorkFlow(){
        return projectService.allWorkFlow();
    }
    @QueryMapping
    public IssueType getIssueType(@Argument Long issueTypeId){
        return projectService.getIssueType(issueTypeId);
    }
     @MutationMapping
     public WorkFlow saveWorkFlow(@Argument WorkFlow workFlow) {
        return projectService.saveWorkFlow(workFlow);
     }
     @QueryMapping
     public List<Issue> issueByCriteria(@Argument List<Criteria> criterias){
        return projectService.issueByCriteria(criterias);
     }
     @MutationMapping
     public List<CustomField> saveCustomField(@Argument CustomField customField){
        return projectService.saveCustomField (customField);
     }
     @QueryMapping
     public List<CustomField> allCustomField(){
        return projectService.allCustomField();
     }

}
