package com.kinga.followtask.service;

import com.kinga.followtask.dto.Criteria;
import com.kinga.followtask.dto.CrossingStateInput;
import com.kinga.followtask.dto.Response;
import com.kinga.followtask.dto.UploadedDto;
import com.kinga.followtask.dto.UserDetailsDeto;
import com.kinga.followtask.entity.*;
import com.kinga.followtask.entity.enumapp.Niveau;
import com.kinga.followtask.repository.*;
import com.kinga.utils.KingaUtils;
import com.nimbusds.jose.shaded.gson.Gson;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

import static com.kinga.followtask.entity.enumapp.Niveau.SUB_TASK;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private static final String PRINCIPALE = "Projet";
    private static final String PROJECT = "PROJECT";
    private static final String TASK = "TASK";
    @Autowired
    public StatusRepository statusRepository;
    final ProjectRepository projectRepository;
    final IssueTypeRepository issueTypeRepository;
    final IssueRepository issueRepository;
    final WorkFlowRepository workFlowRepository;
    final CrossingStateRepository crossingStateRepository;
    final ConfigRepository configRepository;
    final IconeRepository iconeRepository;
    final IssueLabelsRepository issueLabelsRepository;
    final UsingCustomFieldRepository usingCustomFieldRepository;
    public final CustomFieldRepository customFieldRepository;
    final ConfigProjectRepo configProjectRepo;
    final GroupeUserRepository groupeUserRepository;
    final MemberGroupeRepository memberGroupeRepository;
    final UserService userService;
    final UploadedRepository uploadedRepository;
    final DomainActivityRepository domainActivityRepository;
    final CustomIssueFilterRepository customIssueFilterRepository;
    final LabelRepository labelRepository;
    static Logger logger = LoggerFactory.getLogger(ProjectService.class);
    private final DocumentRepository documentRepository;
    private final GlobalSettingsRepository globalSettingsRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final WorkspaceSettingsRepository workspaceSettingsRepository;
    private IssueService issueService;

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
   public void initCollorStatus() {
        List<Status> enAttente = statusRepository.findByDisplayName("En Attente");
        List<Status> ouvert = statusRepository.findByDisplayName("Ouvert");
        List<Status> prog = statusRepository.findByDisplayName("En Cours");
        List<Status> corr = statusRepository.findByDisplayName("Corrigé");
        List<Status> res = statusRepository.findByDisplayName("Résolue");
        List<Status> term = statusRepository.findByDisplayName("Terminé");
        List<Status> ab = statusRepository.findByDisplayName("Abandonné");
        for(Status s : enAttente){
            s.setColor("#5a5a5a");
            statusRepository.save(s);
        }
       for(Status s : ouvert){
           s.setColor("#3dd5f3");
           statusRepository.save(s);
       }
       for(Status s : prog){
           s.setColor("#1c4587");
           statusRepository.save(s);
       }
       for(Status s : corr){
           s.setColor("#0f5132");
           statusRepository.save(s);
       }
       for(Status s : res){
           s.setColor("#0f5132");
           statusRepository.save(s);
       }
       for(Status s : term){
           s.setColor("#0a3622");
           statusRepository.save(s);
       }
       for(Status s : ab){
           s.setColor("#000000");
           statusRepository.save(s);
       }
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
        soutache.setName(TASK);
        soutache.setPrefix(TASK);
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
                configEntry.setInstalationState("working/admin/config/work-space");
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
    private List<Label> getDefaultLabel(Long projectId) {
        List<Label> labels =  labelRepository.findByNameAndProjectId("Urgent",projectId);
        if (CollectionUtils.isEmpty(labels)) {
            Label label = new Label();
            label.setColor("#856404");
            label.setName("Urgent");
            Project p = new Project();
            p.setId(projectId);
            label.setProject(p);
            labelRepository.save(label);
        }
        return labelRepository.findByNameAndProjectId("Urgent",projectId);
    }
    public List<Label> getLabelByProject(Long projetId) {
        List<Label> labels = labelRepository.findByProjectId(projetId);
        if (CollectionUtils.isEmpty(labels)) {
            return getDefaultLabel(projetId);
        }
        return labels;
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
        workFlow = loadWorkFlow(workFlow.getId());
        Status finalStatus = status;
        if (workFlow.getStatuses() == null) {
            workFlow.setStatuses(new ArrayList<>());
        }
        boolean existe = workFlow.getStatuses().stream()
                .anyMatch(s -> Objects.equals(s.getId(), finalStatus.getId()));
        if (existe)
            return workFlow;
        workFlow.getStatuses().add(status);
        String statusIds = StringUtils.hasText(workFlow.getStatesIds()) ? workFlow.getStatesIds() : "";
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

    // -----------------------------------------------------------------
    // Edition du diagramme de workflow : statuts (noeuds) et transitions
    // -----------------------------------------------------------------

    private WorkFlow loadWorkFlow(Long workFlowId) {
        return workFlowRepository.findById(workFlowId)
                .orElseThrow(() -> new RuntimeException("Flux de travail introuvable : " + workFlowId));
    }

    /**
     * Enregistre la position des noeuds du diagramme (JSON serialise cote client).
     */
    @Transactional
    public WorkFlow saveWorkFlowLayout(Long workFlowId, String layout) {
        WorkFlow workFlow = loadWorkFlow(workFlowId);
        workFlow.setLayout(layout);
        return workFlowRepository.save(workFlow);
    }

    /**
     * Cree ou met a jour une transition entre deux statuts du flux.
     */
    @Transactional
    public WorkFlow saveCrossingState(Long workFlowId, CrossingStateInput input) {
        WorkFlow workFlow = loadWorkFlow(workFlowId);
        if (input == null || input.getFrom() == null || input.getTo() == null) {
            throw new RuntimeException("Une transition doit avoir un statut de depart et un statut d'arrivee.");
        }
        if (input.getFrom().equals(input.getTo())) {
            throw new RuntimeException("Une transition ne peut pas boucler sur le meme statut.");
        }
        Status from = statusRepository.findById(input.getFrom())
                .orElseThrow(() -> new RuntimeException("Statut de depart introuvable"));
        Status to = statusRepository.findById(input.getTo())
                .orElseThrow(() -> new RuntimeException("Statut d'arrivee introuvable"));

        List<CrossingStatus> crossings = workFlow.getCrossingStates() == null
                ? new ArrayList<>() : new ArrayList<>(workFlow.getCrossingStates());

        boolean duplicate = crossings.stream().anyMatch(crossing ->
                !crossing.getId().equals(input.getId())
                        && crossing.getFrom() != null && crossing.getTo() != null
                        && crossing.getFrom().getId().equals(from.getId())
                        && crossing.getTo().getId().equals(to.getId()));
        if (duplicate) {
            throw new RuntimeException("Cette transition existe deja dans ce flux.");
        }

        CrossingStatus toSave = input.getId() == null
                ? new CrossingStatus()
                : crossingStateRepository.findById(input.getId()).orElse(new CrossingStatus());
        toSave.setName(input.getName());
        toSave.setDescription(input.getDescription());
        toSave.setFrom(from);
        toSave.setTo(to);
        final CrossingStatus crossing = crossingStateRepository.save(toSave);

        if (crossings.stream().noneMatch(item -> item.getId().equals(crossing.getId()))) {
            crossings.add(crossing);
            workFlow.setCrossingStates(crossings);
            workFlow = workFlowRepository.save(workFlow);
        }
        return loadWorkFlow(workFlow.getId());
    }

    @Transactional
    public WorkFlow deleteCrossingState(Long workFlowId, Long crossingStateId) {
        WorkFlow workFlow = loadWorkFlow(workFlowId);
        if (!CollectionUtils.isEmpty(workFlow.getCrossingStates())) {
            List<CrossingStatus> remaining = workFlow.getCrossingStates().stream()
                    .filter(crossing -> !crossing.getId().equals(crossingStateId))
                    .collect(Collectors.toList());
            workFlow.setCrossingStates(remaining);
            workFlow = workFlowRepository.save(workFlow);
        }
        crossingStateRepository.findById(crossingStateId).ifPresent(crossingStateRepository::delete);
        return loadWorkFlow(workFlow.getId());
    }

    /**
     * Retire un statut du flux ainsi que toutes les transitions qui le touchent.
     * Le statut lui-meme n'est pas supprime : il peut servir dans d'autres flux.
     */
    @Transactional
    public WorkFlow removeStatusFromWorkFlow(Long workFlowId, Long statusId) {
        WorkFlow workFlow = loadWorkFlow(workFlowId);

        List<CrossingStatus> orphans = CollectionUtils.isEmpty(workFlow.getCrossingStates())
                ? new ArrayList<>()
                : workFlow.getCrossingStates().stream()
                    .filter(crossing -> (crossing.getFrom() != null && statusId.equals(crossing.getFrom().getId()))
                            || (crossing.getTo() != null && statusId.equals(crossing.getTo().getId())))
                    .collect(Collectors.toList());

        if (!CollectionUtils.isEmpty(workFlow.getCrossingStates())) {
            List<CrossingStatus> remaining = workFlow.getCrossingStates().stream()
                    .filter(crossing -> !orphans.contains(crossing))
                    .collect(Collectors.toList());
            workFlow.setCrossingStates(remaining);
        }
        if (!CollectionUtils.isEmpty(workFlow.getStatuses())) {
            List<Status> statuses = workFlow.getStatuses().stream()
                    .filter(status -> !statusId.equals(status.getId()))
                    .collect(Collectors.toList());
            workFlow.setStatuses(statuses);
        }
        workFlow = workFlowRepository.save(workFlow);
        orphans.forEach(crossingStateRepository::delete);
        return loadWorkFlow(workFlow.getId());
    }

    /**
     * Supprime un flux de travail, refuse tant qu'un type de tache l'utilise.
     */
    @Transactional
    public Response deleteWorkFlow(Long workFlowId) {
        WorkFlow workFlow = loadWorkFlow(workFlowId);
        if (!CollectionUtils.isEmpty(workFlow.getIssueTypes())) {
            throw new RuntimeException("Ce flux est utilise par " + workFlow.getIssueTypes().size()
                    + " type(s) de tache : il ne peut pas etre supprime.");
        }
        List<CrossingStatus> crossings = CollectionUtils.isEmpty(workFlow.getCrossingStates())
                ? new ArrayList<>() : new ArrayList<>(workFlow.getCrossingStates());
        workFlow.setCrossingStates(new ArrayList<>());
        workFlow.setStatuses(new ArrayList<>());
        workFlowRepository.save(workFlow);
        crossings.forEach(crossingStateRepository::delete);
        workFlowRepository.delete(workFlow);

        Response response = new Response();
        response.setStatus("success");
        response.setCode("OK");
        response.setMessage("Flux " + workFlow.getName() + " supprime");
        return response;
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

    public List<CustomField> allCustomField(Long projectId) {
        return customFieldRepository.findByProjectId(projectId);
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
        /*List<IssueType> issueTypes = issueTypeRepository.findByProjectId(projectId);
        return issueTypes;*/
        List<IssueType> masters = issueTypeRepository.findByProjectIdAndLevel(projectId, Niveau.PARENT);
        return masters;
    }

    public IssueType removeIssueTypeParent(Long childId) {
        IssueType child = issueTypeRepository.getById(childId);
        child.setParent(null);
        return issueTypeRepository.save(child);
    }

    /**
     * Supprime un type de tache. La suppression est refusee tant que le type
     * est utilise par des taches ou qu'il porte des sous-types, pour ne pas
     * laisser de references orphelines.
     */
    @Transactional
    public Response deleteIssueType(Long issueTypeId) {
        IssueType issueType = issueTypeRepository.findById(issueTypeId)
                .orElseThrow(() -> new RuntimeException("Type de tache introuvable : " + issueTypeId));

        List<Issue> issues = issueRepository.findByIssueTypeIdIn(List.of(issueTypeId));
        if (!CollectionUtils.isEmpty(issues)) {
            throw new RuntimeException("Ce type est utilise par " + issues.size()
                    + " tache(s) : il ne peut pas etre supprime.");
        }

        List<IssueType> children = issueTypeRepository.findByParentId(issueTypeId);
        if (!CollectionUtils.isEmpty(children)) {
            throw new RuntimeException("Ce type possede " + children.size()
                    + " sous-type(s) : supprimez ou detachez-les d'abord.");
        }

        List<UsingCustomField> usings = usingCustomFieldRepository.findByIssueTypeId(issueTypeId);
        if (!CollectionUtils.isEmpty(usings)) {
            usingCustomFieldRepository.deleteAll(usings);
        }
        issueTypeRepository.delete(issueType);

        Response response = new Response();
        response.setStatus("success");
        response.setCode("OK");
        response.setMessage("Type " + issueType.getName() + " supprime");
        return response;
    }

    public List<IssueType> listIssueTypeMaster(Long projectId) {
        List<IssueType> masters = issueTypeRepository.findByProjectIdAndLevel(projectId, Niveau.PARENT);
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

    public String getNextKeyParent(Long issueTypeId, Long projectId) {
        Optional<IssueType> issueType = issueTypeRepository.findById(issueTypeId);
        if (!issueType.isPresent())
            return "";
        Integer numero = issueRepository.findMaxProjectNumberWithPrefixAndProject(issueType.get().getPrefix() + "-", issueTypeId, projectId);
        if (numero == null) {
            numero = 0;
        }
        numero++;
        return issueType.get().getPrefix() + "-" + numero;
    }

    public Issue getIssue(String issueKey) {
        return this.issueRepository.findByIssueKey(issueKey);
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


    public Uploaded uploadFile(MultipartFile file, String directory, String newDirectory, Long documentId) throws IOException {
        Document doc = documentRepository.getById(documentId);
        String fileName = file.getOriginalFilename();
        String baseDirectory = KingaUtils.getDefaultWorkSpaceDirectory()+ File.separator + (doc.getTypeDocument() == null? "DOCUMENT" : doc.getTypeDocument().name() ) ;
        String uploadDir ="";
        if (directory == null || "undefined".equalsIgnoreCase(directory)) {
            directory = baseDirectory;
            uploadDir = directory;
        } else  {
            uploadDir = KingaUtils.decodeText(directory);
        }

        Files.createDirectories(Paths.get(uploadDir));

        if (!StringUtils.isEmpty(newDirectory)) {
            Path newPathDir = Paths.get(uploadDir, newDirectory);
            Files.createDirectories(newPathDir);
            uploadDir = newPathDir.toString();
        }

        // Garder le nom original et gérer les doublons
        String finalFileName = resolveFileName(uploadDir, fileName);

        Path filePath = Paths.get(uploadDir, finalFileName);
        Files.write(filePath, file.getBytes());

        Uploaded uploaded = new Uploaded(fileName, filePath.toString());
        Document document = new Document();
        document.setTitre(doc.getTitre());
        document.setId(documentId);
        uploaded.setDocument(document);
        uploaded = uploadedRepository.save(uploaded);

        return uploaded;
    }

    /**
     * Résout le nom final du fichier.
     * Si le fichier existe déjà, ajoute un suffixe numérique : -01, -02, etc.
     */
    private String resolveFileName(String uploadDir, String originalFileName) {
        // Séparer le nom de base et l'extension
        String baseName;
        String extension;

        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex != -1) {
            baseName  = originalFileName.substring(0, dotIndex);   // "cours-angular"
            extension = originalFileName.substring(dotIndex);       // ".pdf"
        } else {
            baseName  = originalFileName;
            extension = "";
        }

        // Si le fichier n'existe pas encore, on retourne le nom tel quel
        Path candidate = Paths.get(uploadDir, originalFileName);
        if (!Files.exists(candidate)) {
            return originalFileName;
        }

        // Sinon, on cherche un suffixe libre : -01, -02, ...
        int counter = 1;
        while (true) {
            String numberedName = String.format("%s-%02d%s", baseName, counter, extension);
            candidate = Paths.get(uploadDir, numberedName);
            if (!Files.exists(candidate)) {
                return numberedName;
            }
            counter++;
        }
    }
    public List<DomainActivity> listActivity() {
        return domainActivityRepository.findAll();
    }

    public IssueFilter saveCustomFilter(IssueFilter customFilter) {
        return customIssueFilterRepository.save(customFilter);
    }

    public List<IssueFilter> getMyFilters(Long projectId, String userId) {
        return customIssueFilterRepository.findByProjectIdAndUserId(projectId,userId);
    }

    public Label saveLabel(Label label) {
        if (label.getId() == null) {
            List<Label> existing =  labelRepository.findByNameAndProjectId(label.getName(),label.getProject().getId());
            if(!CollectionUtils.isEmpty(existing)) {
                throw new RuntimeException("Label "+label.getName() +" is alredy exist ");
            }
        }
        return labelRepository.save(label);
    }

    public Issue getIssueById(Long issueId) {
        return issueRepository.getById(issueId);
    }

    public List<IssueLabels> addLabelInIssue(Long issueId, Long labelId) {
       List<IssueLabels> labels = issueLabelsRepository.findByIssueIdAndLabelId(issueId,labelId);
       if (!CollectionUtils.isEmpty(labels))
           return issueLabelsRepository.findByIssueId(issueId);

        Issue issue = new Issue();
        issue.setId(issueId);
        Label label = new Label();
        label.setId(labelId);
        IssueLabels issueLabels = new IssueLabels();
        issueLabels.setLabel(label);
        issueLabels.setIssue(issue);
        issueLabelsRepository.save(issueLabels);
        return issueLabelsRepository.findByIssueId(issueId);
    }
    public List<IssueLabels> removeLabelInIssue(Long issueId, Long labelId) {
        List<IssueLabels> labels = issueLabelsRepository.findByIssueIdAndLabelId(issueId,labelId);
        if (CollectionUtils.isEmpty(labels))
            return new ArrayList<>();
        labels.forEach(l->{
            issueLabelsRepository.delete(l);
        });
        return labels;

    }
    public List<AppSettings> getSettings(String userId) {
        List<AppSettings> all = new ArrayList<>();
        List<GlobalSettings> global = globalSettingsRepository.findAll();
        if (!CollectionUtils.isEmpty(global)) {
            all.addAll(global);
        }
        List<UserSettings> userSettings = userSettingsRepository.findByUserId( userId);
        if (!CollectionUtils.isEmpty(userSettings)) {
            all.addAll(userSettings);
        }
        return all;
    }
}
