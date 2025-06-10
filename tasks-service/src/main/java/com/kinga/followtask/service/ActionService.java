package com.kinga.followtask.service;

import com.kinga.followtask.dto.ActionItemInput;
import com.kinga.followtask.dto.OutputNotification;
import com.kinga.followtask.entity.*;
import com.kinga.followtask.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ActionService {

    private final ActionItemRepository actionItemRepository;
    private final ActionGroupeRepository actionGroupeRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final NotificationRepository notificationRepository;
    private final UploadedRepository uploadedRepository;
    private final IssueRepository issueRepository;
    private final StatusRepository statusRepository;
    private final ProjectService projectService;


    public void generateAndSendNotification(ActionGroupe actionGroupe, Set<String> specificUsers) {
        Set<String> globalsUsers = actionGroupe.userToNotifies();

        if (!CollectionUtils.isEmpty(specificUsers)) {
            for (String userId : specificUsers) {
                generateSpecificNotification(actionGroupe, userId);
                globalsUsers.remove(userId);
            }

        }
        if (globalsUsers != null && !globalsUsers.isEmpty()) {
            generateGlobalNotification(actionGroupe, globalsUsers);
        }
    }

    public Notification generateGlobalNotification(ActionGroupe actionGroupe, Set<String> userIds) {
        Set<String> toNotofy = actionGroupe.userToNotifies();
        if (toNotofy.isEmpty()) {
            return null;
        }
        Notification notification = new Notification();
        String message = actionGroupe.buildMessage(null);
        notification.setMessage(message);
        notification.setAction(actionGroupe);
        notification.setTitre("Test Notification");
        notification.setUserIds(userIds);
        notification.setProject(actionGroupe.getIssue().getProject());
        notification = notificationRepository.save(notification);
        Map<String,Object> map = new HashMap<>();
        OutputNotification notif = new OutputNotification(notification);
        map.put(MessagesService.NEW_NOTIFICATION,notif);
        for (String toNotifyItem : notification.getUserIds()) {
            simpMessagingTemplate.convertAndSend("/topic/datas/" + toNotifyItem, map);
        }
        return notificationRepository.save(notification);
    }
    public Notification generateSpecificNotification(ActionGroupe actionGroupe, String userIds) {
        Set<String> toNotofy = actionGroupe.userToNotifies();
        if (toNotofy.isEmpty()) {
            return null;
        }
        Notification notification = new Notification();
        String message = actionGroupe.buildMessage(userIds);
        notification.setMessage(message);
        notification.setAction(actionGroupe);
        notification.setTitre("Test Notification");
        notification.setUserIds(new HashSet<>(Arrays.asList(userIds)));
        notification.setProject(actionGroupe.getIssue().getProject());
        notification = notificationRepository.save(notification);
        Map<String,Object> map = new HashMap<>();
        OutputNotification notif = new OutputNotification(notification);
        map.put(MessagesService.NEW_NOTIFICATION,notif);
        for (String toNotifyItem : notification.getUserIds()) {
            simpMessagingTemplate.convertAndSend("/topic/datas/" + toNotifyItem, map);
        }
        return notificationRepository.save(notification);
    }


    public void addDocumentAction(Document doc, Issue issue) {
        ActionGroupe actionGroupe = new ActionGroupe();
        actionGroupe.setIssue(issue);
        actionGroupe.setCreated(new Date());
        actionGroupe.setUser(doc.getUserApp());
        actionGroupe = actionGroupeRepository.save(actionGroupe);
        ActionDocument actonItem= new ActionDocument();
        actonItem.setDocument(doc);
        actonItem.setIssue(issue);
        actonItem.setActionGroupe(actionGroupe);
        actonItem = actionItemRepository.save(actonItem);
        List<ActionItem> actionItemList = new ArrayList<>();
        actionItemList.add(actonItem);
        actionGroupe.setActions(actionItemList);
        generateAndSendNotification(actionGroupe, null);
    }
    public void addDocumentAction(Document doc) {
        ActionDocument actonItem= new ActionDocument();
        actonItem.setDocument(doc);
    }

    public void ceateAssigneAction(String userId,Issue issue) {
        ActionGroupe actionGroupe = new ActionGroupe();
        actionGroupe.setIssue(issue);
        actionGroupe.setCreated(new Date());
        UserApp user = new UserApp();
        user.setId(userId);
        actionGroupe.setUser(user);
        actionGroupe = actionGroupeRepository.save(actionGroupe);
        ActionAssigne actonItem= new ActionAssigne();
        actonItem.setAssigne(issue.getAssigne());
        actonItem.setIssue(issue);
        actonItem.setActionGroupe(actionGroupe);
        actonItem = actionItemRepository.save(actonItem);
        List<ActionItem> actionItemList = new ArrayList<>();
        actionItemList.add(actonItem);
        actionGroupe.setActions(actionItemList);
        generateAndSendNotification(actionGroupe, actionGroupe.userSpecificToNotifies());
    }
    public ActionItem saveAction(ActionItemInput action) {
        ActionItem actionItem = ActionItem.fromInput(action);
        ActionGroupe actionGroupe = actionItem.getActionGroupe();
        actionItem.setActionGroupe(actionGroupe);
        Issue issue = actionGroupe.getIssue();
        issue = issueRepository.getById(issue.getId());
        issue.setProject(issue.getProject());
        actionGroupe.setIssue(issue);
        actionGroupe = actionGroupeRepository.save(actionGroupe);
        switch (actionItem.getActionType()) {
            case ASSIGN ->{
                ActionAssigne actionAssigne = (ActionAssigne) actionItem;
                UserApp assignee = actionAssigne.getAssigne();
                UserApp oldAssignee = issue.getAssigne();
                if (oldAssignee != null) {
                    actionAssigne.setOldAssigne(oldAssignee);
                }
                issue.setAssigne(assignee);
                issue = issueRepository.save(issue);
                actionItem = actionItemRepository.save(actionAssigne);
                actionAssigne.setIssue(issue);
                break;
            }
            case STATUS -> {
                ActionStatus actionStatus = (ActionStatus) actionItem;
                Status  oldStatus = issue.getStatus();
                Status newStatus = actionStatus.getStatus();
                issue.setStatus(newStatus);
                issue = issueRepository.save(issue);
                actionStatus.setOldStatusValue(oldStatus);
                actionStatus.setIssue(issue);
                actionItem = actionItemRepository.save(actionStatus);
                break;
            }
        }

        actionGroupe.setActions(Arrays.asList(actionItem));
        generateAndSendNotification(actionGroupe, actionGroupe.userSpecificToNotifies());
        sendAction(actionItem);
        return actionItemRepository.save(actionItem);
    };
    public void sendAction(ActionItem action) {
        Project project = action.getIssue().getProject();
        Set<String> members = getMembers(project.getPrefix());
        Map<String,Object> map = new HashMap<>();
        map.put(MessagesService.PROCESS_ACTION,new ActionItemInput(action));
        for (String toNotifyItem : members) {
            simpMessagingTemplate.convertAndSend("/topic/datas/" + toNotifyItem, map);
        }
    }
    public Set<String> getMembers(String prefix) {
        List<GroupeUser> groups = projectService.getGroupeUserForProject(prefix);
        Set<String> members = new HashSet<>();
        if (!CollectionUtils.isEmpty(groups)) {
            for (GroupeUser memberGroupe : groups) {
                if (CollectionUtils.isEmpty(memberGroupe.getMembers()))
                    continue;
                for( MemberGroupe member : memberGroupe.getMembers()) {
                    members.add(member.getUser().getId());
                }
            }
        }
        return members;
    }
}
