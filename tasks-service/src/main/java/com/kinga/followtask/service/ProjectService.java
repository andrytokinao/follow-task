package com.kinga.followtask.service;

import com.kinga.followtask.dto.Criteria;
import com.kinga.followtask.dto.UploadedDto;
import com.kinga.followtask.dto.UserDetailsDeto;
import com.kinga.followtask.entity.*;
import com.kinga.followtask.entity.enumapp.Niveau;
import com.kinga.followtask.repository.*;
import com.kinga.followtask.repository.criteria.IssueSearchCriteria;
import com.kinga.followtask.repository.criteria.IssueSpecification;
import com.kinga.utils.KingaUtils;
import com.nimbusds.jose.shaded.gson.Gson;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

import static com.kinga.followtask.entity.enumapp.Niveau.SUB_TASK;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private static final String PRINCIPALE = "Tâche Principale";
    private static final String PROJECT = "PROJECT";
    private static final String SOUS_TACHE = "Sous_tâche";
    @Autowired
    public StatusRepository statusRepository;
    final ProjectRepository projectRepository;
    final IssueTypeRepository issueTypeRepository;
    final IssueRepository issueRepository;
    final WorkFlowRepository workFlowRepository;
    final ConfigRepository configRepository;
    final IconeRepository iconeRepository;
    final UsingCustomFieldRepository usingCustomFieldRepository;
    public final CustomFieldRepository customFieldRepository;
    final ConfigProjectRepo configProjectRepo;
    final GroupeUserRepository groupeUserRepository;
    final MemberGroupeRepository memberGroupeRepository;
    final UserService userService;
    final UploadedRepository uploadedRepository;
    final DomainActivityRepository domainActivityRepository;
    final CustomIssueFilterRepository customIssueFilterRepository;
    static Logger logger = LoggerFactory.getLogger(ProjectService.class);

    public Status saveStatus(Status status) {
        return statusRepository.save(status);
    }

    public List<Status> findAll() {
        return statusRepository.findAll();
    }

    public Project getProjectById(Long id) {
        return projectRepository.getById(id);
    }

    public Project getByPrefix(String prefix) {
        return this.projectRepository.findByPrefix(prefix);
    }

    /*
     * 1) Creation projet
     * 2) Creation type ( projet oblogatoire )
     * 3) - Creation work flow
     *    - Setet dans le type
     * 4) Creation et ou affication des status dans le workFlow
     * */
    public List<Project> allProjects() {
        return projectRepository.findAll();
    }

    public List<Project> getProjectByUser(String userId) {

        UserDetailsDeto userDetails = userService.findByUsername(userId);
        List<MemberGroupe> groupeSystems = memberGroupeRepository.findByUserIdAndGroupeType(userId, GroupeUser.SYSTEM_GROUPE);
        if (userDetails == null) {
            return new ArrayList<>();
        }
        if (userDetails.getPermissions().contains("CAN_ACCESS_ALL")) {
            return projectRepository.findAll();
        }
        List<MemberGroupe> memberGroupes = memberGroupeRepository.findByUserIdAndGroupeType(userId, GroupeUser.PROJECT_GROUPE);
        List<String> projectPrefixs = new ArrayList<>();
        if (memberGroupes.size() != 0) {
            memberGroupes.forEach(memberGroupe -> {
                String prefix = memberGroupe.getGroupe().getPrefix().replaceAll("_GROUPE", "");
                projectPrefixs.add(prefix);
            });
        }
        if (CollectionUtils.isEmpty(projectPrefixs)) {
            return new ArrayList<>();
        }
        return projectRepository.findByPrefixIn(projectPrefixs);
    }

    public WorkFlow getDefaultWorkFlow() {
        WorkFlow workFlow = workFlowRepository.findWorkFlowByName("Default workflow");
        if (workFlow != null) {
            return workFlow;
        }
        workFlow = new WorkFlow();
        workFlow.setName("Default workflow");
        workFlow.setActive(true);
        workFlow.setStatuses(defalutStatusList());
        return workFlowRepository.save(workFlow);
    }

    private List<Status> defalutStatusList() {
        List<Icone> icones = Arrays.asList(
                new Icone("\uf252", "fas fa-hourglass-half", "class"),
                new Icone("\uf07c", "fas fa-folder-open", "class"),
                new Icone("\uf1da", "fas fa-tasks", "class"),
                new Icone("\uf044", "fas fa-edit", "class"),
                new Icone("\uf058", "fas fa-check-circle", "class"),
                new Icone("\uf11e", "fas fa-flag-checkered", "class"),
                new Icone("\uf05e", "fas fa-ban", "class")
        );
        List<String> statusNames = Arrays.asList(
                "En Attente", "Ouvert", "En Cours", "Corrigé", "Résolue", "Terminé", "Abandonné"
        );
        Map<String, Icone> statusMap = new LinkedHashMap<>();
        for (int i = 0; i < statusNames.size(); i++) {
            Icone icone = iconeRepository.save(icones.get(i));
            statusMap.put(statusNames.get(i), icone);
        }
        List<Status> statuses = new ArrayList<>();
        for (int i = 0; i < icones.size(); i++) {
            Icone icone = icones.get(i);
            String displayName = statusNames.get(i);
            Status status = new Status();
            status.setIcone(icone);
            status.setDisplayName(displayName);
            status.setId((long) (i + 1));
            status = statusRepository.save(status);
            statuses.add(status);
        }
        return statuses;
    }

    public List<IssueType> getOrInitialiseDefaultIssueType(Project project) {
        List<IssueType> issueTypes = new ArrayList<>();
        IssueType principale = null;

        principale = new IssueType();
        principale.setName(PRINCIPALE);
        principale.setPrefix(PROJECT);
        principale.setLevel(Niveau.PARENT);
        Icone tachePrincipaleIcone = iconeRepository.save(new Icone("\uf542", "fas fa-project-diagram", "class"));
        principale.setIcone(tachePrincipaleIcone);
        principale.setCurentWorkFlow(getDefaultWorkFlow());
        principale.setProject(project);
        principale = issueTypeRepository.save(principale);

        issueTypes.add(principale);
        IssueType soutache = null;
        Icone sousTacheIcone = iconeRepository.save(new Icone("\uf0ae", "fas fa-tasks", "class"));
        soutache = new IssueType();
        soutache.setName(SOUS_TACHE);
        soutache.setPrefix(SUB_TASK.name());
        soutache.setLevel(SUB_TASK);
        soutache.setIcone(sousTacheIcone);
        soutache.setCurentWorkFlow(getDefaultWorkFlow());
        issueTypeRepository.save(soutache);
        soutache.setParent(principale);
        soutache.setProject(project);
        soutache = issueTypeRepository.save(soutache);

        issueTypes.add(soutache);
        return issueTypes;
    }

    public void initDomaineActivity() {
        List<DomainActivity> domainActivities = new ArrayList<>();
        domainActivities.add(new DomainActivity(01L, "DEFAULT", "Type par defaut", null));
        domainActivities.add(new DomainActivity(02L, "BATIMENT", "Batiment et traveau public ", null));
        domainActivities.add(new DomainActivity(03L, "TOPO", "Service topographie et amenagement teritoire ", null));
        domainActivities.add(new DomainActivity(04L, "DEV", "Service , et developpement informatique ", null));
        domainActivities.add(new DomainActivity(05L, "COMPTABILITE", "Gestion et contabilité", null));
        domainActivities.add(new DomainActivity(06L, "MEDIA", "Traitement media", null));
        domainActivityRepository.saveAll(domainActivities);
    }

    public DomainActivity getDefaultDomaineActivity() {
        return domainActivityRepository.getById(01l);
    }

    // Etape 1 : Creation projet
    public Project createProjectOrSave(Project project) throws IOException {
        boolean initIssueType = false;
        if (project.getDomainActivity() == null) {
            DomainActivity domainActivity = getDefaultDomaineActivity();
            project.setDomainActivity(domainActivity);
        }
        ConfigEntry configEntry = configRepository.getByActiveIs(true);
        String installation = configEntry.getInstalationState();

        if (StringUtils.isEmpty(project.getName()) || StringUtils.isEmpty(project.getPrefix())) {
            throw new RuntimeException("Name and prefix are required");
        }
        project.setPrefix(project.getPrefix().toUpperCase().replaceAll(" ", ""));
        if (project.getId() == null) {
            if (projectRepository.findByPrefix(project.getPrefix()) != null) {
                throw new RuntimeException("Prefix " + project.getPrefix() + " is alredy in use");
            }
            initIssueType = true;

        }
        if (StringUtils.isEmpty(project.getPath())) {
            if (StringUtils.isEmpty(configEntry.getWorkDirectory())) {
                configEntry.setInstalationState("private/admin/config/work-space");
                configRepository.save(configEntry);
                project.setPath(KingaUtils.encodeText(KingaUtils.getDefaultWorkSpaceDirectory() + File.separator + project.getPrefix()));
            } else {
                project.setPath(KingaUtils.encodeText(KingaUtils.decodeText(configEntry.getWorkDirectory()) + "/" + project.getPrefix()));
            }
        }
        project = projectRepository.save(project);
        if (initIssueType) {
            this.getOrInitialiseDefaultIssueType(project);
        }
        completConfig(project);
        return project;
    }

    public List<ConfigProject> completConfig(Project project) throws IOException {
        String configPathLabel = "config.project." + project.getId() + ".path";
        List<ConfigProject> configPaths = configProjectRepo.findConfigProjectsByConfigof(configPathLabel);
        if (!CollectionUtils.isEmpty(configPaths)) {
            return configPaths;
        }
        ConfigProject configPath = new ConfigProject();
        configPath.setConfigof(configPathLabel);
        configPath.setValue(KingaUtils.encodeText(KingaUtils.getDefaultWorkSpaceDirectory() + File.separator + project.getPrefix()));
        configProjectRepo.save(configPath);
        return configProjectRepo.findConfigProjectsByConfigofLike("config.project." + project.getId() + "%");

    }

    public List<GroupeUser> getGroupeUserForProject(String prefix) {
        Project project = projectRepository.findByPrefix(prefix);
        if (project == null) {
            throw new RuntimeException("Project #" + project + " not found");
        }
        getOrCreateGroupe(prefix + "_GROUPE", "Groupe user for project " + project.getName(), GroupeUser.PROJECT_GROUPE);
        return groupeUserRepository.findByPrefix(project.getPrefix() + "_GROUPE");
    }

    public GroupeUser getOrCreateGroupe(String prefix, String name, String type) {
        List<GroupeUser> groupeUsers = groupeUserRepository.findByPrefix(prefix);
        if (!CollectionUtils.isEmpty(groupeUsers)) {
            return groupeUsers.get(0);
        }
        GroupeUser groupeUser = null;
        groupeUser = new GroupeUser();
        groupeUser.setPrefix(prefix);
        groupeUser.setType(type);
        groupeUser.setName(name);
        return groupeUserRepository.save(groupeUser);
    }


    // Etape 2 : Creation type
    public IssueType saveIssueType(IssueType issueType) {
        ConfigEntry configEntry = configRepository.getByActiveIs(true);
        String installation = configEntry.getInstalationState();
        if (issueType.getIcone() != null)
            issueType.setIcone(iconeRepository.save(issueType.getIcone()));
        issueType = issueTypeRepository.save(issueType);
        if (issueType.getCurentWorkFlow() == null) {
            issueType.setCurentWorkFlow(getDefaultWorkFlow());
        }

        if (issueType.getProject() == null)
            throw new RuntimeException("Type doit etre affecté au projet ");
        Project project = issueType.getProject();
        if (!"complete".equalsIgnoreCase(installation)) {
            configEntry.setInstalationState("rivate/admin/worging/choose-groupe?project=" + project.getPrefix());
        }

        configRepository.save(configEntry);
        return issueTypeRepository.save(issueType);
    }

    // Etape 3 : Creation / chois  workFlow et affectation de type ==> Affecter a des status
    public WorkFlow affectWorkFlow(IssueType issueType) {
        WorkFlow workFlow = issueType.getCurentWorkFlow();
        workFlow.setActive(true);
        ConfigEntry configEntry = configRepository.getByActiveIs(true);
        String installation = configEntry.getInstalationState();
        workFlow.setActive(true);
        if (issueType.getId() == null)
            throw new RuntimeException("Issue type not save");
        if (!issueTypeRepository.existsById(issueType.getId())) {
            throw new RuntimeException("IssueType#" + issueType.getId() + " not found");
        }
        issueType = issueTypeRepository.getById(issueType.getId());
        workFlow = workFlowRepository.getById(workFlow.getId());
        if (!"complete".equalsIgnoreCase(installation)) {
            configEntry.setInstalationState("create-project/work-flow-status?work-flow=" + workFlow.getId());
        }
        issueType.setCurentWorkFlow(workFlow);
        configRepository.save(configEntry);
        issueTypeRepository.save(issueType);
        logger.info("affect type " + issueType.getName() + " workflow " + workFlow.getName());
        return workFlow;
    }

    // Etape 4 : Creation des different status dans un workflow ==> Creation / Selection de groupe pour une type
    public WorkFlow addStatus(Status status, WorkFlow workFlow) {
        if (status.getIcone() != null)
            iconeRepository.save(status.getIcone());
        status = statusRepository.save(status);
        workFlow = workFlowRepository.findById(workFlow.getId()).get();
        Status finalStatus = status;
        boolean existe = workFlow.getStatuses().stream()
                .anyMatch(s -> s.getId() == finalStatus.getId());
        if (existe)
            return workFlow;
        workFlow.getStatuses().add(status);
        String statusIds = workFlow.getStatesIds();
        statusIds += (StringUtils.isEmpty(statusIds) ? "" : ",") + status.getId();
        workFlow.setStatesIds(statusIds);
        logger.debug("add status " + status.toString() + " " + workFlow.toString() + " " + workFlow.getProject().toString());
        return workFlowRepository.save(workFlow);
    }

    public List<WorkFlow> allWorkFlow() {
        return workFlowRepository.findAll();
    }

    public IssueType getIssueType(Long issueTypeId) {
        return this.issueTypeRepository.getReferenceById(issueTypeId);
    }

    public WorkFlow saveWorkFlow(WorkFlow workFlow) {
        return workFlowRepository.save(workFlow);
    }

    private WorkFlow SaveWorkFlos(WorkFlow wf) {
        WorkFlow existing = workFlowRepository.findWorkFlowByName(wf.getName());
        if (existing != null) {
            wf.setId(existing.getId());
        }
        return existing;
    }

    public List<Issue> issueByCriteria(List<Criteria> criterias) {
        List<Criteria> typeCriterias = Criteria.findByField(criterias, "issueTypeId");
        List<Long> issueTypeIds = new ArrayList<>();
        if (!CollectionUtils.isEmpty(typeCriterias)) {
            String issueTypeIdS = typeCriterias.get(0).getValue();
            try {
                issueTypeIds.add(Long.valueOf(issueTypeIdS));
            } catch (Exception e) {
                logger.error(e.getMessage(), e);
            }
        }
        if (!CollectionUtils.isEmpty(issueTypeIds)) {
            return issueRepository.findByIssueTypeIdIn(issueTypeIds);
        }
        return new ArrayList<>();
    }

    public CustomField saveCustomField(CustomField customField) {
        return customFieldRepository.save(customField);
    }

    public List<CustomField> allCustomField() {
        return customFieldRepository.findAll();
    }

    public List<UsingCustomField> useCustomField(UsingCustomField usingCustomField) {
        if (usingCustomField.getCustomField() == null ||
                usingCustomField.getCustomField().getId() == null ||
                usingCustomField.getIssueType() == null ||
                usingCustomField.getIssueType().getId() == null) {
            throw new RuntimeException("Invalid data ");
        }
        List<UsingCustomField> existing = usingCustomFieldRepository.findByCustomFieldIdAndIssueTypeId(usingCustomField.getCustomField().getId(), usingCustomField.getIssueType().getId());
        if (CollectionUtils.isEmpty(existing)) {
            usingCustomFieldRepository.save(usingCustomField);
        }
        return usingCustomFieldRepository.findByIssueTypeId(usingCustomField.getIssueType().getId());
    }

    public List<UsingCustomField> unUseCustomField(UsingCustomField usingCustomField) {
        if (usingCustomField.getCustomField() == null ||
                usingCustomField.getCustomField().getId() == null ||
                usingCustomField.getIssueType() == null ||
                usingCustomField.getIssueType().getId() == null) {
            throw new RuntimeException("Invalid data ");
        }
        List<UsingCustomField> existing = usingCustomFieldRepository.findByCustomFieldIdAndIssueTypeId(usingCustomField.getCustomField().getId(), usingCustomField.getIssueType().getId());
        if (!CollectionUtils.isEmpty(existing)) {
            existing.forEach(e -> usingCustomFieldRepository.delete(e));
        }
        return usingCustomFieldRepository.findByIssueTypeId(usingCustomField.getIssueType().getId());
    }

    public List<UsingCustomField> customFieldsByIssueType(Long issueTypeId) {
        return usingCustomFieldRepository.findByIssueTypeId(issueTypeId);
    }

    public ConfigProject setPath(String path, Long projectId) {
        ConfigProject configProject = new ConfigProject();
        configProject.setConfigof("config.project." + projectId + ".path");
        configProject.setValue(path);
        return saveOrUpdateConfig(configProject);
    }

    public ConfigProject saveOrUpdateConfig(ConfigProject cf) {
        List<ConfigProject> existes = configProjectRepo.findConfigProjectsByConfigof(cf.getConfigof());
        ConfigProject configProject = null;
        if (CollectionUtils.isEmpty(existes)) {
            configProject = new ConfigProject();
        } else {
            configProject = existes.get(0);
        }
        configProject.setConfigEntry(cf.getConfigEntry());
        configProject.setValue(cf.getValue());

        return configProjectRepo.save(configProject);
    }

    public List<ConfigProject> getConfigProject(Long projectId) {
        return configProjectRepo.findConfigProjectsByConfigofLike("%config.project." + projectId + ".%");
    }

    public IssueType affectIssueTypeForParent(Long childId, Long parrentId) {
        IssueType child = issueTypeRepository.getById(childId);
        IssueType parent = issueTypeRepository.getById(parrentId);
        child.setParent(parent);
        return issueTypeRepository.save(child);
    }

    public IssueType getIssueTypeById(Long issueTypeId) {
        return issueTypeRepository.getById(issueTypeId);
    }

    public List<IssueType> allIssueType(Long projectId) {
        List<IssueType> issueTypes = issueTypeRepository.findByProjectId(projectId);
        return issueTypes;
    }

    public IssueType removeIssueTypeParent(Long childId) {
        IssueType child = issueTypeRepository.getById(childId);
        child.setParent(null);
        return issueTypeRepository.save(child);
    }

    public List<IssueType> listIssueTypeMaster(Long projectId) {
        List<IssueType> masters = issueTypeRepository.findByProjectIdAndLevel(projectId, Niveau.PARENT);
        List<IssueType> principale = issueTypeRepository.findByName(PRINCIPALE);
        if (CollectionUtils.isEmpty(masters)) {
            return principale;
        }
        masters.addAll(principale);
        return masters;
    }

    public List<IssueType> listIssueTypeSubtasks(Long masterId) {
        return issueTypeRepository.findByParentId(masterId);
    }

    public String getNextKey(Long issueTypeId) {
        Optional<IssueType> issueType = issueTypeRepository.findById(issueTypeId);
        if (!issueType.isPresent())
            return "";
        Integer numero = issueRepository.findMaxProjectNumberWithPrefix(issueType.get().getPrefix() + "-", issueTypeId);
        if (numero == null) {
            numero = 0;
        }
        numero++;
        return issueType.get().getPrefix() + "-" + numero;
    }

    public Issue getIssue(String issueKey) {
        return this.issueRepository.findByIssueKey(issueKey);
    }

    public List<Issue> loadSubtask(Long parentId) {
        return this.issueRepository.findByParentId(parentId);
    }

    public List<Issue> allByProject(String prefix) {
        return this.issueRepository.findByIssueTypeProjectPrefix(prefix);
    }

    public List<Issue> loadIssueMasterByProject(Long projectId) {
        List<IssueType> types = listIssueTypeMaster(projectId);
        return issueRepository.findByIssueTypeIn(types);

    }


    public WorkFlow getWorkFlow(Long workFlowId) {
        return workFlowRepository.getById(workFlowId);
    }

    public List<WorkFlow> workFlowsByProject(Long projectId) {
        WorkFlow defaultWf = this.getDefaultWorkFlow();
        List<WorkFlow> wfs = workFlowRepository.findByProjectId(projectId);
        wfs.add(defaultWf);
        return wfs;
    }


    public Uploaded uplodoadFile(MultipartFile file, String directory, String newDirectory, Long documentId) throws IOException {
        String fileName = file.getOriginalFilename();
        String uploadDir = KingaUtils.decodeText(directory);
        Files.createDirectories(Paths.get(uploadDir));
        if (!StringUtils.isEmpty(newDirectory)) {
            Path newPathDir = Paths.get(uploadDir, newDirectory);
            Files.createDirectories(newPathDir);
            uploadDir = newPathDir.toString();
        }
        String newFileName = UUID.randomUUID().toString();
        Path filePath = Paths.get(uploadDir, newFileName);
        Files.write(filePath, file.getBytes());
        Uploaded uploaded = new Uploaded(fileName, filePath.toString());
        Document document = new Document();
        document.setId(documentId);
        uploaded.setDocument(document);
        return uploadedRepository.save(uploaded);
    }

    public List<DomainActivity> listActivity() {
        return domainActivityRepository.findAll();
    }

    public IssueFilter saveCustomFilter(IssueFilter customFilter) {
        return customIssueFilterRepository.save(customFilter);
    }
}
