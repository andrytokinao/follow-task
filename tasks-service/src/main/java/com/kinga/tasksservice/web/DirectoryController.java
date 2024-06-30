package com.kinga.tasksservice.web;

import com.kinga.tasksservice.dto.Dossier;
import com.kinga.tasksservice.dto.Repertoire;
import com.kinga.tasksservice.service.IssueService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class DirectoryController {
    final IssueService issueService;
    @GetMapping(path = "/api/load-directory")
    @ResponseBody
    public Repertoire loadDirectory(@RequestParam(required = true) Long issueId){
        return issueService.loadDirectory(issueId);
    }
    @GetMapping(path = "/api/sous-dossier/root")
    @ResponseBody
    public List<Dossier> sousDossierRoot(){
        return Dossier.loadRootDirectory();
    }
    @GetMapping(path = "/api/sous-dossier")
    @ResponseBody
    public List<Dossier> sousDossier(@RequestParam(required = true) String path){
        return Dossier.getSousDossier(path);
    }
}
