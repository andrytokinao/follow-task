package com.kinga.followtask.service;


import com.kinga.followtask.dto.OutputMessage;
import com.kinga.followtask.entity.*;
import com.kinga.followtask.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatService {
    public static String PROCESS_NEW_MESSAGE = "newMessage";
    public static String PROCESS_DOCUMENT = "processDocument";
    public static String NEW_NOTIFICATION = "newNotification";
    public static String PROCESS_ACTION = "processAction";
    public static String NEW_UPLOADED = "newUploaded";
    public static String SLIDE_DOSSIER = "slideDossier";
    private final CanalMemberRepository canalMemberRepository;
    private final CanalRepository canalRepository;
    private final ProjectRepository projectRepository;
    private final GroupeUserRepository groupeUserRepository;
    private final UserRepository userRepository;
    private final MessagesRepository messagesRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;

    public MessageApp sendMessage(MessageApp message) {
      MessageApp  mes = messagesRepository.save(message);
      sendMessageTo(mes,PROCESS_NEW_MESSAGE);
      return mes;
    }

    private void sendMessageTo(MessageApp mes,String methode) {
        Canall canall = canalRepository.getById(mes.getCanall().getId());
        mes.setCanall(canall);
        OutputMessage output = new OutputMessage(mes);
        Map<String, Object> map = new HashMap<>();
        map.put(methode,Arrays.asList(output));
        canall.getMembers().forEach(m -> {
                simpMessagingTemplate.convertAndSend("/topic/datas/"+m.getContact().getUserApp().getId(), map);
        });
    }

    public MessageApp readMessage(Long messageId, String userId) {
        return new MessageApp();
    }
    public Canall getCannal(Long workspaceId, Long issueMasterId, List<String> users ) {
        if (users == null || users.isEmpty() || users.size() == 1 ) {
            throw new RuntimeException("One or more users is empty");
        }
        return new Canall();
    }
    public Canall getCannal(Long workspaceId, List<String> users ) {
        return new Canall();
    }
    public Canall getCannal(List<String> users ) {
        return new Canall();
    }
    public List<Canall> listCanall(Long workspaceId, String connectedUserId) {
        Project project = projectRepository.findById(workspaceId).orElse(null);
        if (project == null) {
            return new ArrayList<>();
        }
        Set<String> userIds = new HashSet<>();
        groupeUserRepository.findByPrefix(project.getPrefix()).forEach(groupe -> {
            groupe.getMembers().forEach(groupeMember -> {
                userIds.add(groupeMember.getUser().getId());
            });
        });
        userIds.remove(connectedUserId);

        List<Canall> canalls = new ArrayList<>();
        userIds.forEach(userId -> {
            Canall canall =  findExactChannelByMembers(workspaceId, Arrays.asList(userId,connectedUserId));
            canalls.add(canall);
        });
        return canalls;
    }
    public List<MessageApp> loadMessages(Long cannalId, Date last) {
        return new ArrayList<>();
    }

    public List<Canall> myChannels(Long projectId, String me) {
        return canalRepository.findByProjectsIdAndMembersContactUserAppIdIn(projectId, Arrays.asList(me));
    }
    public Canall findExactChannelByMembers(Long projectId, List<String> userIds) {
        Canall canall = new Canall();
        List<Canall> canalls = canalRepository.exactChannelByMembers(projectId, userIds, userIds.size());
        if (CollectionUtils.isEmpty(canalls)) {
            // Creation cannal
            Project p = new Project();
            p.setId(projectId);
            canall.setProjects(p);
            canall.setTypeCanal(TypeCanal.PROJECT);
            canall = canalRepository.save(canall);
            Canall finalCanall = canall;
            userIds.forEach(uid -> {
                    UserApp u = new UserApp();
                    u.setId(uid);
                    CanalContact cm = new CanalContact();
                    cm.setCanall(finalCanall);
                    canalMemberRepository.save(cm);
            });
            canall = finalCanall;
        } else {
            canall = canalls.get(0);
        }
        return canall;
    }

    public Canall createCanal(Canall canall) {
       List<Canall> existings =  canalRepository.exactChannelByMembers(canall.getProjects().getId(),canall.getMembersIds(),canall.getMembersIds().size());
       Canall existing = canall;
       if (!CollectionUtils.isEmpty(existings)) {
           existing = existings.get(0);
           existing.setProjects(canall.getProjects());
           existing.setMembers(canall.getMembers());
           existing.setTypeCanal(TypeCanal.PROJECT);

           existing.setPseudo(canall.getPseudo());
     //      existing.setMembersIds(canall.getMembersIds());
           return canalRepository.save(existing);
       } else {
           if (CollectionUtils.isEmpty(canall.getMembersIds())
                || canall.getMembersIds().size() < 1){
               throw new RuntimeException("members is required and must both be 2");
           }
           canall = canalRepository.save(canall);
           Canall finalCanall = canall;
           canall.getMembersIds().forEach(id -> {
               CanalContact cm = new CanalContact();
               UserApp u = new UserApp();
               u.setId(id);
           //    cm.setCanall(u);
               cm.setCanall(finalCanall);
               canalMemberRepository.save(cm);
           });
       }
       return canalRepository.save(canall);
    }

    public List<Canall> getCanalByProject(Long projectId, List<String> userId) {
        return canalRepository.findByProjectsIdAndMembersContactUserAppIdIn(projectId,userId);
    }
  //  @Scheduled(fixedRate = 10000)
    public void scheduledMessage() {
        MessageApp message = new MessageApp();
        message.setText("Message scheduled");
        UserApp userApp = new UserApp();
        userApp.setId("idd");
        message.setSender(userApp);
        sendMessageTo(message,"scheduledMessage");
    }
}
