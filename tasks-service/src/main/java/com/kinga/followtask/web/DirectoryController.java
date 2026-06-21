package com.kinga.followtask.web;

import com.kinga.followtask.dto.Dossier;
import com.kinga.followtask.dto.Fichier;
import com.kinga.followtask.dto.Repertoire;
import com.kinga.followtask.service.ActionService;
import com.kinga.followtask.service.IssueService;
import com.kinga.utils.KingaUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class DirectoryController {
    final IssueService issueService;
    private final ActionService actionService;

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
    @GetMapping(path = "/api/repertoires")
    @ResponseBody
    public List<Repertoire> getRepertoires(@RequestParam(required = true) String path){
        return Dossier.getRepertoires(path);
    }
    @GetMapping(path = "/api/paths")
    @ResponseBody
    public List<String> getPaths(@RequestParam(required = true) String path) throws Exception {
        return Dossier.listDirectoryPaths (KingaUtils.decodeText (path));
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
    @GetMapping("/api/slide-next")
    public Fichier getSlideImage(@RequestParam String path, @RequestParam Integer numero, @RequestParam String action ) throws IOException {
       return  this.actionService.getSlideImage(path,numero,action);
    }
}
