package com.kinga.tasksservice.web;

import com.kinga.tasksservice.dto.Dossier;
import com.kinga.tasksservice.dto.Repertoire;
import com.kinga.tasksservice.service.IssueService;
import com.kinga.utils.KingaUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;
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
    @GetMapping("photo/{endocedPath}")
    public ResponseEntity<Resource> serveFile(@PathVariable String endocedPath) {
        try {
            Path file = Paths.get(KingaUtils.decodeText (endocedPath));
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}
