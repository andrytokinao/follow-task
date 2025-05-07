package com.kinga.followtask.service;

import com.kinga.followtask.dto.OutputNotification;
import com.kinga.followtask.entity.*;
import com.kinga.followtask.repository.ActionGroupeRepository;
import com.kinga.followtask.repository.ActionItemRepository;
import com.kinga.followtask.repository.NotificationRepository;
import com.kinga.followtask.repository.UploadedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ActionService {

    private final ActionItemRepository actionItemRepository;
    private final ActionGroupeRepository actionGroupeRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final NotificationRepository notificationRepository;
    private final UploadedRepository uploadedRepository;

    public ActionGroupe saveAction(ActionItem actionItem) {
        return new ActionGroupe();
    };
    public Notification generateAndSendNotification(ActionGroupe actionGroupe) {
        Set<String> toNotofy = actionGroupe.userToNotifies();
        if (toNotofy.isEmpty()) {
            return null;
        }
        Notification notification = new Notification();
        String message = actionGroupe.buildMessage();
        notification.setMessage(message);
        notification.setAction(actionGroupe);
        notification.setTitre("Test Notification");
        notification.setUserIds(actionGroupe.userToNotifies());
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
        generateAndSendNotification(actionGroupe);
    }
    public void addDocumentAction(Document doc) {
        ActionDocument actonItem= new ActionDocument();
        actonItem.setDocument(doc);
    }

    public void ceateAssigneAction(Issue issue) {

    }
}
