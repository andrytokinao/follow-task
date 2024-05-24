package com.kinga.tasksservice.service;

import com.kinga.tasksservice.entity.*;
import com.kinga.tasksservice.repository.*;
import com.kinga.utils.KingaUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {
    @Autowired
    public StatusRepository statusRepository;
    final ProjectRepository projectRepository;
    final IssueTypeRepository issueTypeRepository;
    final WorkFlowRepository workFlowRepository;
    final ConfigRepository configRepository;
    final IconeRepository iconeRepository;

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

    // Etape 1 : Creation projet
    public Project createProjectOrSave(Project project) {
        ConfigEntry configEntry = configRepository.getByActiveIs(true);
        String installation = configEntry.getInstalationState();

        if (StringUtils.isEmpty(project.getName()) || StringUtils.isEmpty(project.getPrefix())) {
            throw new RuntimeException("Name and prefix are required");
        }
        if (project.getId() == null) {
            if (projectRepository.findByPrefix(project.getPrefix()) != null) {
                throw new RuntimeException("Prefix " + project.getPrefix() + " is alredy in use");
            }
        }
        if (StringUtils.isEmpty(project.getPath())) {
            if (StringUtils.isEmpty(configEntry.getWorkDirectory())){
                configEntry.setInstalationState("private/admin/config/work-space");
                configRepository.save(configEntry);
                throw new RuntimeException("configuration work space not completed");
            }
            project.setPath(KingaUtils.encodeText(KingaUtils.decodeText(configEntry.getWorkDirectory()) + "/" + project.getPrefix()));
        }
        project = projectRepository.save(project);
        if (!"complete".equalsIgnoreCase(installation)) {
            configEntry.setInstalationState("private/admin/project/issue-type?project=" + project.getPrefix());
            configEntry.setProjectPrefix(project.getPrefix());
            configRepository.save(configEntry);
        }
        return project;
    }

    // Etape 2 : Creation type
    public List<IssueType> saveIssueType(IssueType issueType) {
        ConfigEntry configEntry = configRepository.getByActiveIs(true);
        String installation = configEntry.getInstalationState();
        if(issueType.getIcone() != null)
            issueType.setIcone(iconeRepository.save(issueType.getIcone()));
        issueType = issueTypeRepository.save(issueType);

        if (issueType.getProject() == null)
            throw new RuntimeException("Type doit etre affecté au projet ");
        Project project = issueType.getProject();
        if (!"complete".equalsIgnoreCase(installation)) {
            configEntry.setInstalationState("rivate/admin/project/choose-groupe?project=" + project.getPrefix());
        }
        if (Project.CONFIG_STATE1.equalsIgnoreCase(project.getStatusConfig())) {
            project.setStatusConfig(Project.CONFIG_STATE2);
        }
        configRepository.save(configEntry);
        issueTypeRepository.save(issueType);
        return issueTypeRepository.findByProjectId(issueType.getProject().getId());
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
        workFlow = workFlowRepository.save(workFlow);
        if (!"complete".equalsIgnoreCase(installation)) {
            configEntry.setInstalationState("create-project/work-flow-status?work-flow=" + workFlow.getId());
        }
        issueType.setCurentWorkFlow(workFlow);
        configRepository.save(configEntry);
        issueTypeRepository.save(issueType);
        return workFlow;
    }

    // Etape 4 : Creation des different status dans un workflow ==> Creation / Selection de groupe pour une type
    public WorkFlow addStatus(Status status, WorkFlow workFlow, Integer issueTypeId) {
        ConfigEntry configEntry = configRepository.getByActiveIs(true);
        String installation = configEntry.getInstalationState();
        if (!"complete".equalsIgnoreCase(installation)) {
            configEntry.setInstalationState("create-project/groupe-for-issueType?issueType=" + issueTypeId);
        }
        if(status.getIcone() != null)
            iconeRepository.save(status.getIcone());
        status = statusRepository.save(status);
        workFlow.getStatuses().add(status);
        String statusIds = workFlow.getStatesIds();
        statusIds += (StringUtils.isEmpty(statusIds) ? "" : ",") + status.getId();
        workFlow.setStatesIds(statusIds);
        configRepository.save(configEntry);
        return workFlowRepository.save(workFlow);
    }

    public List<WorkFlow> allWorkFlow() {
        return workFlowRepository.findAll();
    }

    public IssueType getIssueType(Long issueTypeId) {
        return this.issueTypeRepository.getReferenceById(issueTypeId);
    }
}
