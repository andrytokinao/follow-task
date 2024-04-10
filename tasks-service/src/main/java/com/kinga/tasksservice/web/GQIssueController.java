package com.kinga.tasksservice.web;

import com.kinga.tasksservice.dto.Dossier;
import com.kinga.tasksservice.dto.Repertoire;
import com.kinga.tasksservice.dto.ValueDto;
import com.kinga.tasksservice.entity.*;
import com.kinga.tasksservice.service.AuthorizationService;
import com.kinga.tasksservice.service.ConfigService;
import com.kinga.tasksservice.service.IssueService;
import com.kinga.tasksservice.service.StatusService;
import com.kinga.utils.KingaUtils;
import lombok.AllArgsConstructor;
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
    StatusService statusService;
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
}
