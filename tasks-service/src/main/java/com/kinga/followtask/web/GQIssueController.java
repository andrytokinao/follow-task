package com.kinga.followtask.web;

import com.kinga.followtask.dto.*;
import com.kinga.followtask.entity.Uploaded;
import com.kinga.followtask.entity.*;
import com.kinga.followtask.repository.criteria.IssueSearchCriteria;
import com.kinga.followtask.service.*;
import com.nimbusds.jose.shaded.gson.Gson;
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
import java.text.ParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class GQIssueController {
    @Autowired
    IssueService issueService;
    @Autowired
    ProjectService projectService;
    final AuthorizationService authorizationService;
    final EventService eventService;
    final ConfigService configService;
    @Autowired
    private ActionService actionService;
    private final DocumentService documentService;
    private final PlanningEventProgressService progressService;

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
    public ResponseEntity<Resource> downloadFiles(@RequestParam List<String> fileNames, @RequestParam String directory, @RequestParam String fileName) throws MalformedURLException {
        return issueService.downloadFiles(fileNames,directory,fileName);
    }
    @GetMapping("/api/fech-file")
    @ResponseBody
    public ResponseEntity<Resource> fechFile(@RequestParam String fileName,String fileType)  {

        return issueService.fechFile(fileName,fileType);
    }
    @PostMapping("/api/upload/logo")
    public ResponseEntity<String> uploadFile(@RequestPart("file") MultipartFile file) {
        return issueService.uploadLogo(file);
    }
    @PostMapping("/api/upload")
    @ResponseBody
    public ResponseEntity<String> uploadFile(@RequestPart("file") MultipartFile file,@RequestParam String directory,@RequestParam(name = "newDirectory")  String newDirectory,@RequestParam(name = "documentId") Long documentId) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Le fichier est vide.");
        }
        try{
           Uploaded uploaded = projectService.uploadFile(file, directory, newDirectory,documentId);

           String json = (new Gson()).toJson(new UploadedDto(uploaded.getId(),uploaded.getName(),uploaded.getPath(),uploaded.getEncodedPath()));
           return ResponseEntity.ok().body(json);

        } catch (Exception ex){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Une erreur s'est produite lors du téléchargement du fichier."+ex.getMessage());
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
    public Project createProjectOrSave(@Argument  Project project) throws IOException {
        return projectService.createProjectOrSave(project);
    }
    @MutationMapping
    public IssueType saveIssueType(@Argument IssueType issueType){
        return projectService.saveIssueType(issueType);
    }
    @MutationMapping
    public WorkFlow affectWorkFlow(@Argument IssueType issueType){
        return projectService.affectWorkFlow(issueType);
    }
    @MutationMapping
    public WorkFlow addStatus(@Argument  Status status, @Argument  WorkFlow workFlow){
        return projectService.addStatus(status, workFlow);
    }
    @QueryMapping
    public List<WorkFlow> allWorkFlow(){
        return projectService.allWorkFlow();
    }
    @QueryMapping
    public WorkFlow getWorkFlow(@Argument Long workFlowId) {
       return this.projectService.getWorkFlow(workFlowId);
    }
    @QueryMapping
    public IssueType getIssueType(@Argument Long issueTypeId){
        return projectService.getIssueType(issueTypeId);
    }
    @QueryMapping
    public List<WorkFlow> workFlowsByProject(@Argument Long projectId) {
        return projectService.workFlowsByProject(projectId);
    }
    @QueryMapping
    public List<IssueType> allIssueType(@Argument Long projectId) {
        return projectService.allIssueType(projectId);
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
     public CustomField saveCustomField(@Argument CustomField customField){
        return projectService.saveCustomField (customField);
     }
    @MutationMapping
    public List<UsingCustomField> useCustomField(@Argument UsingCustomField usingCustomField){
        return projectService.useCustomField (usingCustomField);
    }
    @MutationMapping
    public List<UsingCustomField> unUseCustomField(@Argument UsingCustomField usingCustomField){
        return projectService.unUseCustomField (usingCustomField);
    }
    @QueryMapping
    public List<UsingCustomField> customFieldsByIssueType(@Argument Long issueTypeId){
        return projectService.customFieldsByIssueType (issueTypeId);
    }
     @QueryMapping
     public List<CustomField> allCustomField(@Argument Long projectId){
        return projectService.allCustomField(projectId);
     }
     @MutationMapping
     public Issue assigneToUser(@Argument Issue issue , @Argument String executor) {
        return issueService.assigneToUser(issue,executor);
     }
    @QueryMapping
     public CustomField getCustomField(@Argument Long id) {
        return issueService.getCustomField(id);
     }
    @QueryMapping
    public List<ConfigProject> getConfigProject (@Argument Long projectId) {
        return projectService.getConfigProject (projectId);
    }

    @MutationMapping
    public ConfigProject saveOrUpdateConfig (@Argument ConfigProject configProject) {
        return projectService.saveOrUpdateConfig (configProject);
    }
    @QueryMapping
    public List<GroupeUser> getGroupeUserForProject(@Argument String prefix){
        return projectService.getGroupeUserForProject(prefix);
    }
    @MutationMapping
    public IssueType affectIssueTypeForParent(@Argument Long childId, @Argument Long parrentId){
        return projectService.affectIssueTypeForParent(childId,parrentId);
    }
    @MutationMapping
    public IssueType removeIssueTypeParent(@Argument Long childId){
        return projectService.removeIssueTypeParent(childId);
    }
    @QueryMapping
    public IssueType getIssueTypeById(@Argument Long issueTypeId){
        return projectService.getIssueTypeById(issueTypeId);
    }
    @QueryMapping
    public List<IssueType> listIssueTypeMaster(@Argument Long projectId){
        return projectService.listIssueTypeMaster(projectId);
    }
    @QueryMapping
    public List<IssueType> listIssueTypeSubtasks(@Argument  Long masterId){
        return projectService.listIssueTypeSubtasks(masterId);

    }
    @QueryMapping
    public String getNextKey(@Argument Long issueTypeId){
        return projectService.getNextKey(issueTypeId);
    }
    @QueryMapping
    public String getNextKeyParent(@Argument Long issueTypeId, @Argument Long projectId){
        return projectService.getNextKeyParent(issueTypeId,projectId);
    }



    @QueryMapping
    public Issue getIssue(@Argument String issueKey, @Argument Long projectId) {
        return issueService.getIssue(issueKey,projectId);
    }
    @QueryMapping
    public List<Issue> loadSubtask(@Argument Long parentId){
        return issueService.loadSubtask(parentId);
    }
    @QueryMapping
    public List<Issue> loadIssueMasterByProject(@Argument Long projectId) {
        return projectService.loadIssueMasterByProject(projectId);
    }
    @QueryMapping
    public List<Issue> searchIssues(@Argument IssueSearchCriteria criteria) {
        return  issueService.searchIssues (criteria);
    }
    @QueryMapping
    public List<PlanningEvent> searchEvents(@Argument EventSearchCriteriaDTO criteria) {
        return  eventService.searchEvents (criteria);
    }
    @QueryMapping
    public PlanningEvent nextEvent(@Argument EventSearchCriteriaDTO criteria, @Argument Long projectId) {
        return eventService.nextEvent(criteria,projectId);
    }
    @QueryMapping
    public List<EventType> allEventType() {
        return  eventService.allEventType ();
    }
    @MutationMapping
    public PlanningEvent saveEvent(@Argument PlanningEvent event){
        return eventService.saveEvent(event);
    }
    @MutationMapping
    public PlanningEvent deleteEvent(@Argument Long eventId){
        return eventService.deleteEvent(eventId);
    }
     @QueryMapping
    public PlanningEvent getByEventId(@Argument Long eventId){
        return eventService.getByEventId(eventId);
    }
    @QueryMapping
    public List<Project> getProjectByUser(@Argument String userId) {
        return projectService.getProjectByUser(userId);
    }
   @MutationMapping
    public Document addDocument(@Argument Document document){
       return issueService. addDocument(document);
    }
    @QueryMapping
    public List<Document> getDocuments(@Argument Long issueId, @Argument TypeDocument typeDocument) {
        return issueService.getDocuments(issueId,typeDocument);
    }
    @MutationMapping
    public Uploaded saveUploaded(@Argument Uploaded uploaded){
        return issueService.saveUploaded(uploaded);
    }
    @QueryMapping
    public List<DomainActivity> listActivity() {
        return projectService.listActivity();
    }
    @MutationMapping
    public IssueFilter saveCustomFilter(@Argument IssueFilter customFilter) {
        return projectService.saveCustomFilter(customFilter);
    }
    @QueryMapping
    public List<IssueFilter> getMyFilters(@Argument  Long projectId , @Argument String userId) {
        List filters = projectService.getMyFilters(projectId,userId);
        return filters;
    }
    @QueryMapping
    public List<Label> getLabelByProject(@Argument Long projectId) {
        return projectService.getLabelByProject(projectId);
    }
    @QueryMapping
    public Issue getIssueById(@Argument Long issueId) {
        return projectService.getIssueById(issueId);
    }
    @MutationMapping
    public Label saveLabel(@Argument Label label) {
        return projectService.saveLabel(label);
    }
    @MutationMapping
    public List<IssueLabels> addLabelInIssue(@Argument Long issueId, @Argument Long labelId) {
        return projectService.addLabelInIssue(issueId,labelId);
    }
    @MutationMapping
    public List<IssueLabels>  removeLabelInIssue(@Argument Long issueId, @Argument Long labelId) {
        return projectService.removeLabelInIssue(issueId,labelId);
    }
    @QueryMapping
    public List<AppSettings>  getSettings(@Argument String userId) {
        return projectService.getSettings(userId);
    }
    @MutationMapping
    public Map<String,String> deleteIssue(@Argument Long issueId){
        issueService.deleteIssue(issueId);
        Map<String,String> map = new HashMap<>();
        map.put("status","success");
        map.put("message","success");
        return map;
    }
    @QueryMapping
    public Document loadDocumentById(@Argument Long documentId) {
        return documentService.loadDocumentById(documentId);
    }
    @MutationMapping
    public Document forwardDocument(@Argument Document document){
        return issueService.forwardDocument(document);
    }
    @MutationMapping
    public Response deleteDocumentById(@Argument Long documentId) {
        return issueService.deleteDocumentById(documentId);
    }
    @QueryMapping
    public List<Notification> getNotificationsByUserId(@Argument String userId) {
        return issueService.getNotificationsByUserId(userId);
    }
    @MutationMapping
    public Response seenNotification(@Argument String userId) {
        return issueService.seenNotification(userId);
    }
    @MutationMapping
    public ActionItem saveAction(@Argument ActionItemInput action) {
        return actionService.saveAction(action);
    }
    @QueryMapping
    public List<IssuePlanningSummary> getIssuePlanningSummaries(@Argument List<Long> issueIds) {
        return issueService.getIssuePlanningSummaries(issueIds);
    }

    @QueryMapping
    public IssuePlanningSummary getIssuePlanningSummary(@Argument Long issueId) {
        return issueService.getIssuePlanningSummary(issueId);
    }
    @QueryMapping
    public PercentageProposalDTO proposeNextPercentage(@Argument Long issueId) {
        return progressService.proposeNextPercentage(issueId);
    }
    @QueryMapping
    public List<UserHoursData> loadUserHours(@Argument Long issueId) {
        return this.issueService.loadUserHours(issueId);
    }
}
