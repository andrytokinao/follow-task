package com.kinga.followtask.service;

import com.kinga.followtask.dto.Dossier;
import com.kinga.followtask.dto.Repertoire;
import com.kinga.followtask.dto.ValueDto;
import com.kinga.followtask.entity.CustomFieldValue;
import com.kinga.followtask.entity.*;
import com.kinga.followtask.repository.*;
import com.kinga.utils.KingaUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.rmi.RemoteException;
import java.text.ParseException;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class IssueService {
    @Autowired
    public IssueRepository issueRepository;
    @Autowired
    public ProjectRepository projectRepository;
    @Autowired
    public IssueTypeRepository issueTypeRepository;
    @Autowired
    public WorkFlowRepository workFlowRepository;
    @Autowired
    public StatusRepository statusRepository;
    @Autowired
    public ValueDeoRepository valueDeoRepository;
    @Autowired
    public CommentRepository commentRepository;
    @Autowired
    CustomFieldRepository customFieldRepository;
    @Autowired
    public ProjectService projectService;
    @Autowired
    public ConfigRepository configRepository;
    @Autowired
    private UserAppRepository userAppRepository;

    public List<Issue> saveIssue(Issue issue) throws IOException {
        if(issue.getId() ==null) {
            issue.setCreationDate(new Date());
        } else {
            issue.setUpdateDate( new Date());
        }

        issue.setReporter(getCurrentUser());
        if (issue.getIssueType() == null) {
            throw new RuntimeException("type mast bee renseign");
        }

        IssueType issueType = issueTypeRepository.getById(issue.getIssueType().getId());
         if (StringUtils.isEmpty(issue.getIssueKey()))
             issue.setIssueKey(getKeySuivente(issueType));
        Project project = issueType.getProject();
        if (StringUtils.isEmpty(project.getPath())) {
            throw new RemoteException(" Config non terminer ");
        }
        WorkFlow workFlow = issueType.getCurentWorkFlow();
        List<Long> issueTypeIds = new ArrayList<>();
        if (workFlow != null) {
            List<IssueType> issueTypes = workFlow.getIssueTypes();
            for (IssueType it : issueTypes){
                issueTypeIds.add(it.getId());
            }
        }
        String homeDirectory = KingaUtils.decodeText(project.getPath()).replaceAll (" ","");
        File projectDirectory = new File(homeDirectory);
        if (!Files.exists(projectDirectory.toPath())) {
            Files.createDirectory(projectDirectory.toPath());
        }
        Path dossier = Paths.get(homeDirectory, issue.getIssueKey());

        if (!Files.exists(dossier)) {
            Files.createDirectory(dossier);
        } else {
            System.out.println("Le répertoire '" + dossier + "' existe déjà.");
        }
        issue.setDirectory(dossier.toString());
        issueRepository.save(issue);
        if (!CollectionUtils.isEmpty(issueTypeIds)) {
            return issueRepository.findByIssueTypeIdIn(issueTypeIds);
        } else {
            return issueRepository.findAll();
        }
    }
    private UserApp getCurrentUser() {
        // TODO : Get connected user
        return null;
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

    public Project getDefaultProject() throws IOException {
        if(projectRepository.existsById(1L))
            return projectRepository.getById(1L);
        String homeDirectory = System.getProperty("user.home");
        Project project = new Project();
        project.setName("Project");
        project.setPrefix(Project.DEFAULT_PREFIX);
        Path baseDirectory = Paths.get(homeDirectory, Project.BASE_DIRECTORY);
        if (!Files.exists(baseDirectory)) {
           Files.createDirectory(baseDirectory);
        }
        Path projectDirectory = Paths.get(baseDirectory.toString(), project.getPrefix());
        if (!Files.exists(projectDirectory)) {
            Files.createDirectory(projectDirectory);
        }
        project.setPath(projectDirectory.toString());
        return projectRepository.save(project);
    }
    public IssueType saveIssueType(IssueType issueType) throws IOException {
        if(issueType.getProject() == null) {
            issueType.setProject(getDefaultProject());
        }
        if(issueType.getCurentWorkFlow() == null)
            issueType.setCurentWorkFlow(getDefaultWorkFlow());
        return issueTypeRepository.save(issueType);
    }

    private WorkFlow getDefaultWorkFlow() {
         if(workFlowRepository.existsById(1L))
             return workFlowRepository.getById(1L);
         WorkFlow workFlow = new WorkFlow();
         if(CollectionUtils.isEmpty(workFlow.getStatuses())) {
             workFlow.setStatuses(defalutStatusList());
         }
         workFlow.setName("Default WorkFlow ");
         workFlow.setActive(true);
         workFlow.setCrossingStates(defalutConfigurationCrossingState(workFlow.getStatuses()));
        return workFlowRepository.save(workFlow);
    }

    private List<CrossingStatus> defalutConfigurationCrossingState(List<Status> statuses) {
        // TODO :
        return new ArrayList<>();
    }

    private List<Status> defalutStatusList() {
        /*if (CollectionUtils.isEmpty(statusRepository.findAll())) {
            Status standBy = new Status();
            standBy.setDisplayName("En attente");
            standBy.setIconeFile("/assets/standby.png");
            statusRepository.save(standBy);

            Status open = new Status();
            open.setDisplayName("A faire");
            open.setIconeFile("/assets/open.png");
            statusRepository.save(open);

            Status progress = new Status();
            progress.setDisplayName("En cours ");
            progress.setIconeFile("/assets/in-progress.png");
            statusRepository.save(progress);

            Status toControll = new Status();
            toControll.setDisplayName("A vérifier");
            toControll.setIconeFile("/assets/to-controll.png");
            statusRepository.save(toControll);

            Status resolved = new Status();
            resolved.setDisplayName("Resolues");
            resolved.setIconeFile("/assets/resolved.png");
            statusRepository.save(resolved);

            Status archive = new Status();
            archive.setDisplayName("Archivés");
            archive.setIconeFile("/assets/archive.png");
            statusRepository.save(archive);
            return statusRepository.findAll();
        }
        return statusRepository.findAllById(Arrays.asList(0L, 1L, 2L, 3L, 4L, 5L));*/
        return null;
    }

    public IssueType getDefaultIssueType() throws IOException {
        // TOTO : Etudier sur la faisabilité
        if (issueTypeRepository.existsById(1L))
            return issueTypeRepository.getById(1L);
        IssueType issueType = new IssueType();
        issueType.setName("TODO");
        issueType.setPrefix("TODO");
        return saveIssueType(issueType);
    }
    public String getKeySuivente(IssueType issueType) throws IOException {
        Project project = issueType.getProject();
        if(project == null ) {
            project = getDefaultProject();
            issueType.setProject(project);
            issueTypeRepository.save(issueType);
        }
        Integer dernierNumero  = project.getDernierNumero() == null ? 0 : project.getDernierNumero();
        Integer nexNumber = new Integer((dernierNumero.intValue() + 1));
        project.setDernierNumero(nexNumber);
        projectRepository.save(project);
        return project.getPrefix()+"-"+nexNumber;
    }
    public Repertoire loadDirectory(Long issueId) {
        Issue issue = issueRepository.getById(issueId);
        if(issue == null)
            throw new RuntimeException("Issue not found");
        return new Dossier(new File(issue.getDirectory()));
    }
        public List<CustomField> allCustomField(Long id){
        return customFieldRepository.findAll();
    }
    public List<CustomFieldValue> getValues(Long id) {
        return valueDeoRepository.findCustomFieldValueByIssueId(id);
    }

    public ResponseEntity<Resource> downloadFiles(List<String> fileNames, String directory) throws MalformedURLException {
        if (CollectionUtils.isEmpty(fileNames)) {
            return null;
        }
        if (fileNames.size() == 1) {
            Path zipFilePath = Paths.get(KingaUtils.decodeText(fileNames.get(0)));
            Resource singleResource = new UrlResource(zipFilePath.toUri());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + singleResource.getFilename() + "\"")
                    .body(singleResource);
        }

        try {
            String zipFileName = directory + ".zip";
            Path zipFilePath = Paths.get(zipFileName);
            ZipOutputStream zipOutputStream = new ZipOutputStream(Files.newOutputStream(zipFilePath));

            for (String fileName : fileNames) {
                Path filePath = Paths.get(KingaUtils.decodeText(fileName));
                Resource resource = new UrlResource(filePath.toUri());
                if (!resource.exists()) {
                    throw new RuntimeException("File not found: " + fileName);
                }
                ZipEntry zipEntry = new ZipEntry(resource.getFilename());
                zipOutputStream.putNextEntry(zipEntry);
                zipOutputStream.write(resource.getInputStream().readAllBytes());
                zipOutputStream.closeEntry();
            }
            zipOutputStream.close();

            Resource zipResource = new UrlResource(zipFilePath.toUri());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + zipResource.getFilename() + "\"")
                    .body(zipResource);

        } catch (IOException ex) {
            throw new RuntimeException("Error downloading files", ex);
        }
    }

    public ResponseEntity<Resource> downloadFiles(String encryptedFileNames) {
        String dechifre = decryptFileNames(encryptedFileNames);
        return null;
    }

    private String decryptFileNames(String encryptedFileNames) {
        try {
            String secretKey = "kinga-digital";
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(), "AES");
            byte[] encryptedBytes = Base64.getDecoder().decode(encryptedFileNames);
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec);
            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            ex.printStackTrace();
            return "";
        }
    }
    public Issue assigneToUser (Issue is) {
        Optional<Issue> optionalIssue = issueRepository.findById (is.getId ());
        Optional<UserApp> userApp = userAppRepository.findById (is.getAssigne ().getId ());
        if(optionalIssue.isPresent ()) {
            Issue issue = optionalIssue.get ();
            issue.setAssigne (userApp.get ());
            issueRepository.save (issue);
        }
        return issueRepository.getById (is.getId ());
    }

    public CustomField getCustomField (Long id) {
        return customFieldRepository.getById (id);
    }
}
