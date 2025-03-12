package com.kinga.followtask.service;


import com.kinga.followtask.entity.*;
import com.kinga.followtask.repository.CanalMemberRepository;
import com.kinga.followtask.repository.CanalRepository;
import com.kinga.followtask.repository.GroupeUserRepository;
import com.kinga.followtask.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.*;

@Service
@RequiredArgsConstructor
public class MessagesService {
    private final CanalMemberRepository canalMemberRepository;
    private final CanalRepository canalRepository;
    private final ProjectRepository projectRepository;
    private final GroupeUserRepository groupeUserRepository;


    public MessageApp sendMessage(MessageApp message, Long cannalId ) {
        return message;
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
        return canalRepository.findByProjectsIdAndMembersUserIdIn(projectId, Arrays.asList(me));
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
                    CanalMember cm = new CanalMember();
                    cm.setCanall(finalCanall);
                    cm.setUser(u);
                    canalMemberRepository.save(cm);
            });
            canall = finalCanall;
        } else {
            canall = canalls.get(0);
        }
        return canall;
    }
}
