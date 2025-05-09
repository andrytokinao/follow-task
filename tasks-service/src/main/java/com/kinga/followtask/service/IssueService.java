package com.kinga.followtask.service;

import com.kinga.followtask.config.ConfigSystem;
import com.kinga.followtask.dto.*;
import com.kinga.followtask.entity.CustomFieldValue;
import com.kinga.followtask.entity.*;
import com.kinga.followtask.repository.*;
import com.kinga.followtask.repository.DocumentMemberRepository;
import com.kinga.followtask.repository.criteria.IssueSearchCriteria;
import com.kinga.followtask.repository.criteria.IssueSpecification;
import com.kinga.utils.KingaUtils;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.aot.InstanceSupplierCodeGenerator;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import javax.swing.*;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.rmi.RemoteException;
import java.sql.Timestamp;
import java.text.ParseException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Slf4j
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
    public ValueDaoRepository valueDaoRepository;
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
    @Autowired
    private EventRepository eventRepository;
    @Autowired
    private IconeRepository iconeRepository;
    @Autowired
    private DocumentRepository documentRepository;
    @Autowired
    private UploadedRepository uploadedRepository;
    @Autowired
    private ConfigSystem configSystem;
    @Autowired
    private AppSettingsRepository appSettingsRepository;
    @Autowired
    private GlobalSettingsRepository globalSettingsRepository;
    @Autowired
    private UserSettingsRepository userSettingsRepository;
    @Autowired
    private WorkspaceSettingsRepository workspaceSettingsRepository;
    @Autowired
    private IssueLabelsRepository issueLabelsRepository;
    @Autowired
    private CustomFieldValueRepository customFieldValueRepository;
    @Autowired
    private DocumentMemberRepository documentMemberRepository;
    @Autowired
    private  SimpMessagingTemplate simpMessagingTemplate;
    @Autowired
    private ActionService actionService;

    public Issue saveIssue(Issue issue) throws IOException {


        if (issue.getIssueType() == null) {
            throw new RuntimeException("type mast bee renseign");
        }
        if (issue.getProject() == null) {
            issue.setProject(issue.getIssueType().getProject());
            if (issue.getProject() == null){
                throw new RuntimeException("project mast bee renseign");
            }

        }
        Project tempProject = issue.getIssueType().getProject();
        Project project = projectRepository.findById(tempProject.getId()).orElse(null);

        IssueType issueType = issueTypeRepository.getById(issue.getIssueType().getId());

        WorkFlow workFlow = issueType.getCurentWorkFlow();
        List<Long> issueTypeIds = new ArrayList<>();
        if (workFlow != null) {
            List<IssueType> issueTypes = workFlow.getIssueTypes();
            for (IssueType it : issueTypes){
                issueTypeIds.add(it.getId());
            }
        }
        if(issue.getId() ==null) {
            issue.setCreationDate(((new Date()).toInstant()).atZone(ZoneId.systemDefault()).toLocalDateTime());
            issue.setReporter(getCurrentUser());
            if (!StringUtils.isEmpty(issue.getIssueKey())) {
                IssueSearchCriteria criteria = new IssueSearchCriteria();
                criteria.setKey(issue.getIssueKey());
                criteria.setProjectId(project.getId());
                List<Issue> existings = searchIssues(criteria);
                if (!CollectionUtils.isEmpty(existings)) {
                    throw new RemoteException(" Key "+issue.getIssueKey() +" is alredy use in sambe project ");
                }

            } else {
                issue.setIssueKey(getKeySuivente(issueType));
            }
            if (StringUtils.isEmpty(project.getPath())) {
                throw new RemoteException(" Config non terminer ");
            }
            if (issue.getStatus() == null ) {
                Status defaultStatus = workFlow.getStatuses().get(0);
                issue.setStatus(defaultStatus);
            }
        } else {
            issue.setUpdateDate(((new Date()).toInstant()).atZone(ZoneId.systemDefault()).toLocalDateTime());

        }
        issue = createDirectoryIfEmpty(issue,project);
        return issueRepository.save(issue);

    }
    public List<Issue> loadSubtask(Long parentId) {
        IssueSearchCriteria criteria = new IssueSearchCriteria();
        criteria.setParentId(parentId);
        return searchIssues(criteria);
    }
    private Issue createDirectoryIfEmpty(Issue issue, Project project) throws IOException {
        if (!StringUtils.isEmpty (issue.getDirectory ()))
            return issue;
        if (issue.getParent () != null) {
            Issue parrent = issueRepository.findById (issue.getParent ().getId ()).orElse (null);
            if (parrent == null ){
                throw new RemoteException ("issue parrent#"+issue.getParent ().getId ()+" not found");
            }
            String parentDirectory = parrent.getDirectory ();
            Path dossier = Paths.get(parentDirectory, issue.getIssueKey());
            if (!Files.exists(dossier)) {
                Files.createDirectory(dossier);
            } else {
                System.out.println("La répertoire '" + dossier + "' existe déjà.");
            }
            issue.setDirectory(dossier.toString());
            return issue;
        }
        // Creation si parent vide
        String homeDirectory = KingaUtils.decodeText(project.getPath()).replaceAll (" ","");
        File projectDirectory = new File(homeDirectory);
        if (!Files.exists(projectDirectory.toPath())) {
            Files.createDirectory(projectDirectory.toPath());
        }
        Path dossier = Paths.get(homeDirectory, issue.getIssueKey());

        if (!Files.exists(dossier)) {
            Files.createDirectory(dossier);
        } else {
            System.out.println("La répertoire '" + dossier + "' existe déjà.");
        }
        issue.setDirectory(dossier.toString());
        return issueRepository.save(issue);
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
        if (comment.getId() ==null )
            comment.setDate(new Date());
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
        else if (value instanceof  CheckBoxCustomFieldValue)
            value.setValue (v.getValues());
        else if (value instanceof  SelectionCustomFieldValue)
            value.setValue (v.getString ());

        valueDaoRepository.save(value);
        return valueDaoRepository.findCustomFieldValueByIssueId(value.getIssue().getId());
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
        return valueDaoRepository.findCustomFieldValueByIssueId(id);
    }

    public ResponseEntity<Resource> downloadFiles(List<String> fileNames, String directory,String newFileName) throws MalformedURLException {
        if (CollectionUtils.isEmpty(fileNames)) {
            return null;
        }
        if (fileNames.size() == 1) {
            Path zipFilePath = Paths.get(KingaUtils.decodeText(fileNames.get(0)));
            Resource singleResource = new UrlResource(zipFilePath.toUri());
            String fileName = StringUtils.isEmpty(newFileName)? singleResource.getFilename() : newFileName;
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
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
            issue.addObserverIds(is.getAssigne().getId ());
            issueRepository.save (issue);
        }
        actionService.ceateAssigneAction(optionalIssue.get());
        return issueRepository.getById (is.getId ());
    }
    public CustomField getCustomField (Long id) {
        return customFieldRepository.getById (id);
    }

    public ResponseEntity<Resource> fechFile(String myPath, String fileType) {
        MediaType mediaType = null;
        if ("pdf".equalsIgnoreCase(fileType)) {
            mediaType = MediaType.APPLICATION_PDF;
        }
        try {
            Path path = Paths.get(KingaUtils.decodeText(myPath));
            Resource pdfResource = new UrlResource(path.toUri());
            String fileName = pdfResource.getFilename() ;

            if (!pdfResource.exists() || !pdfResource.isReadable()) {
                throw new RuntimeException("Le fichier PDF n'existe pas ou n'est pas lisible");
            }
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .body(pdfResource);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la récupération du fichier PDF", e);
        }
    }
    @Transactional
    public Document addDocument(Document document){
        if (document.getId() == null) {
            document.setCreation(((new Date()).toInstant()).atZone(ZoneId.systemDefault()).toLocalDateTime());
        }
        document = documentRepository.save(document);
        List<Uploaded> uploadeds = document.getUploadeds();
       if (!CollectionUtils.isEmpty(uploadeds)) for(Uploaded up :uploadeds){
            up.setDocument(document);
            uploadedRepository.save(up);
        }
        if (!CollectionUtils.isEmpty(document.getMembers())) {
            Document finalDocument = document;
            document.getMembers().forEach(member -> {
                List<DocumentMember> docMembers = documentMemberRepository.findByDocumentIdAndUserId(finalDocument.getId(), member);
                if (!CollectionUtils.isEmpty(docMembers)) {
                    return;
                }
                DocumentMember dm = new DocumentMember();
                dm.setDocument(finalDocument);
                UserApp userApp = new UserApp();
                userApp.setId(member);
                dm.setUser(userApp);
                documentMemberRepository.save(dm);
           });
        };
        Document d = this.documentRepository.findById(document.getId()).orElse(null);
        UserApp userApp = new UserApp();
        if (d != null ) {
            userApp = userAppRepository.getById(d.getUserApp().getId());
            d.setUserApp(userApp);
        }
       // sendDocument(d);
        return d;
    }
    public List<Document> getDocuments(Long issueId, TypeDocument typeDocument) {
        return documentRepository.findByIssuesIdAndTypeDocument(issueId,typeDocument);
    }
    public Uploaded saveUploaded(Uploaded uploaded) {
        Uploaded up = uploadedRepository.save(uploaded);
        Document document = documentRepository.getById(up.getDocument().getId());
        sendDocument(document);
        return up;
    }
    public List<Issue> searchIssues(IssueSearchCriteria criteria) {
        IssueSpecification specification = new IssueSpecification(criteria);
        List<Issue> issues = issueRepository.findAll(specification);
        return issues;
    }

    public Issue getIssue(String issueKey, Long projectId) {
        IssueSearchCriteria criteria = new IssueSearchCriteria();
        criteria.setKey(issueKey);
        criteria.setProjectId(projectId);
        List<Issue> issues = searchIssues(criteria);
        if (!CollectionUtils.isEmpty(issues)){
            if (issues.size()> 1) {
                throw new  RuntimeException("Result not unique ");
            }
            return issues.get(0);
        }
        return null;
    }

    public ResponseEntity<String> uploadLogo(MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Le fichier est vide.");
        }
        try {
            String origineName = file.getOriginalFilename();

            String uploadDir = null;

                uploadDir = StringUtils.isEmpty (configSystem.getProfileDirectories()) ?
                        KingaUtils.getDefaultMediaSpaceDirectory () :
                        configSystem.getProfileDirectories ();
                Files.createDirectories(Paths.get(uploadDir));
                Path filePath = Paths.get(uploadDir, origineName);
                Files.write(filePath, file.getBytes());
                AppSettings global = new GlobalSettings();
                global.setCle("logo");
                global.setActive(true);
                global.setSettingsValue(KingaUtils.encodeText(filePath.toString()));
                saveSettings(global);
                return ResponseEntity.ok().body("Le fichier a été téléchargé avec succès : " + origineName);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
    }
    public AppSettings saveSettings(AppSettings appSettings) {
        if (appSettings.getId() == null) {
            appSettings.setCreated(new Date());
        } else {
            appSettings.setUpdated(new Date());
        }
        if (appSettings.getActive()) {
            if (appSettings instanceof GlobalSettings) {
                List<GlobalSettings> globalSettings = globalSettingsRepository.findByActiveAndCle(true,appSettings.getCle());
                if (!CollectionUtils.isEmpty(globalSettings)) {
                    globalSettings.forEach(gs -> {
                        gs.setActive(false);
                        this.globalSettingsRepository.save(gs);
                    });
                }
            }
           else if (appSettings instanceof UserSettings) {
                List<UserSettings> userSettings = userSettingsRepository.findByActiveAndCleAndUserId(true,appSettings.getCle(),((UserSettings)appSettings).getUser().getId());
                if (!CollectionUtils.isEmpty(userSettings)) {
                    userSettings.forEach(gs -> {
                        gs.setActive(false);
                        this.userSettingsRepository.save(gs);
                    });
                }
            }
            else if (appSettings instanceof WorkspaceSettings) {
                List<WorkspaceSettings> workspaceSettings = workspaceSettingsRepository.findByProjectIdAndActiveAndCle(((WorkspaceSettings) appSettings).getProject().getId(),true,appSettings.getCle());
                if (!CollectionUtils.isEmpty(workspaceSettings)) {
                    workspaceSettings.forEach(gs -> {
                        gs.setActive(false);
                        this.workspaceSettingsRepository.save(gs);
                    });
                }
            }
        }
       return appSettingsRepository.save(appSettings);
    }
    public void deleteDocument(Document document) {
        document.getUploadeds().forEach(up -> {
            uploadedRepository.deleteById(up.getId());
        });
        documentRepository.delete(document);
    }
    public void deleteIssue(Long issueId) {
        Issue issue = issueRepository.findById(issueId).orElse(null);
        if (issue == null) {
            return;
        }
         commentRepository.findByIssueId(issueId).forEach(comm -> {
             commentRepository.delete(comm);
         });
        issue.getDocuments().forEach(doc -> {
            deleteDocument(doc);
        });

        issue.getLabels().forEach( l -> {
            issueLabelsRepository.delete(l);
        });
        issue.getValues().forEach( v -> {
            customFieldValueRepository.delete(v);
        });
        issue.getChildren().forEach( is -> {
            deleteIssue(is.getId());
        });
        issueRepository.delete(issue);

    }
    public void sendDocument(Document doc) {
        doc = documentRepository.getOne(doc.getId());
        OutputDocument output = new OutputDocument(doc);
       Map<String,OutputDocument> mapDocument = new HashMap<>();
       mapDocument.put(MessagesService.PROCESS_DOCUMENT,output);
        List<DocumentMember> docMembers = new ArrayList<>();
        if (doc.getParent() != null) {
            docMembers = documentMemberRepository.findByDocumentId(doc.getParent().getId());
        } else
            docMembers = documentMemberRepository.findByDocumentId(doc.getId());
        if (!CollectionUtils.isEmpty(docMembers)) {
            docMembers.forEach( m -> {
                try {
                    simpMessagingTemplate.convertAndSend("/topic/datas/"+m.getUser().getId(), mapDocument);
                } catch (Exception e) {
                    e.printStackTrace();
                    log.error(e.getMessage());
                }
        });
        }
        Issue issue = issueRepository.findById(doc.getIssues().getId()).orElse(null);
        actionService.addDocumentAction(doc,issue);
    }

    public void sendUploaded(Uploaded uploaded) {
        Document doc = uploaded.getDocument();
        OutputUploaded out = new OutputUploaded(uploaded);
        Map<String,OutputUploaded> mapUploaded = new HashMap<>();
        mapUploaded.put(MessagesService.NEW_UPLOADED,out);
        List<DocumentMember> docMembers = new ArrayList<>();
        if (doc.getParent() != null) {
            Document parent = documentRepository.getById(doc.getParent().getId());
            doc.setParent(parent);
            docMembers = documentMemberRepository.findByDocumentId(doc.getParent().getId());
        } else
            docMembers = documentMemberRepository.findByDocumentId(doc.getId());
        if (!CollectionUtils.isEmpty(docMembers)) {
            docMembers.forEach( m -> {
                try {
                    simpMessagingTemplate.convertAndSend("/topic/datas/"+m.getUser().getId(), out);
                } catch (Exception e) {
                    e.printStackTrace();
                    log.error(e.getMessage());
                }
            });
        }
    }

    public Document loadDocumentById(Long documentId) {
        return this.documentRepository.getById(documentId);
    }

    public Document forwardDocument(Document document) {
        sendDocument(document);
        return document;
    }
}
