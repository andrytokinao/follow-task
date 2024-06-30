package com.kinga.tasksservice.service;

import com.kinga.tasksservice.config.*;
import com.kinga.tasksservice.dto.Accessibility;
import com.kinga.tasksservice.dto.UserDetailsDeto;
import com.kinga.tasksservice.entity.GroupeUser;
import com.kinga.tasksservice.entity.MemberGroupe;
import com.kinga.tasksservice.entity.UserApp;
import com.kinga.tasksservice.repository.GroupeUserRepository;
import com.kinga.tasksservice.repository.MemberGroupeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthorizationService {
    final PermissionSystem permissionSystem;
    final PermissionTask permissionTask;
    final MemberGroupeRepository memberGroupeRepository;
    final GroupeUserRepository groupeUserRepository;
    private final ConfigMenue configMenue;
    public List<MemberGroupe> addStandarUser(UserApp userApp) {
        MemberGroupe memberGroupe = new MemberGroupe();
        memberGroupe.setGroupe(systemGroupe());
        memberGroupe.setUser(userApp);
        memberGroupe.setRole("STANDARD_USER");
        memberGroupeRepository.save(memberGroupe);
        return memberGroupeRepository.findByUserId(userApp.getId());
    }

    public List<MemberGroupe> addUserToAdminSystem(UserApp userApp) {
        MemberGroupe memberGroupe = null;
        List<MemberGroupe> memberGroupes = memberGroupeRepository.findByUserIdAndGroupeType(userApp.getId(), "SYSTEM_GROUPE");
        if (!CollectionUtils.isEmpty(memberGroupes)) {
            memberGroupe = memberGroupes.get(0);
        } else {
            memberGroupe = new MemberGroupe();
            memberGroupe.setUser(userApp);
            memberGroupe.setGroupe(systemGroupe());
        }
        memberGroupe.setRole("SYSTEM_ADMIN");
        memberGroupeRepository.save(memberGroupe);
        return memberGroupeRepository.findByGroupeIdAndUserId(memberGroupe.getGroupe().getId(), userApp.getId());
    }

    public List<MemberGroupe> deletInGroupe(UserApp userApp, GroupeUser groupeUser) {
        List<MemberGroupe> memberGroupes = memberGroupeRepository.findByGroupeIdAndUserId(groupeUser.getId(), userApp.getId());
        if (CollectionUtils.isEmpty(memberGroupes)) {
            memberGroupes.forEach(g -> {
                memberGroupeRepository.delete(g);
            });
        }
        return memberGroupeRepository.findByUserId(userApp.getId());
    }

    public GroupeUser systemGroupe() {
        List<GroupeUser> systemGroupes = groupeUserRepository.findByType("SYSTEM_GROUPE");
        if (!CollectionUtils.isEmpty(systemGroupes))
            return systemGroupes.get(0);
        GroupeUser systemGroupe = new GroupeUser();
        systemGroupe.setType("SYSTEM_GROUPE");
        systemGroupe.setName("Accessibilité au systeme ");
        return groupeUserRepository.save(systemGroupe);
    }

    public Set<String> getAccessibilities(UserApp userApp) {
        Set<String> accessibilites = new HashSet<>();
        List<MemberGroupe> systems = memberGroupeRepository.findByUserIdAndGroupeType(userApp.getId(), "SYSTEM_GROUPE");
        if (!CollectionUtils.isEmpty(systems)) {
            for (MemberGroupe memberGroupe : systems) {
                Optional<RoleApp> role = getRoleSystemByName(memberGroupe.getRole());
                if (!role.isPresent() || CollectionUtils.isEmpty(role.get().getAccessibilities())) {
                    continue;
                }
                for (String acc : role.get().getAccessibilities()) {
                    accessibilites.add(acc);
                }
            }
        }

        List<MemberGroupe> tasks = memberGroupeRepository.findByUserIdAndGroupeType(userApp.getId(), "TASK_GROUPE");
        if (!CollectionUtils.isEmpty(tasks)) {
            for (MemberGroupe memberGroupe : tasks) {
                String prefix = memberGroupe.getGroupe().getPrefix();
                Optional<RoleApp> role = getRoleSystemByName(memberGroupe.getRole());
                if (!role.isPresent() || !CollectionUtils.isEmpty(role.get().getAccessibilities())) {
                    continue;
                }
                for (String acc : role.get().getAccessibilities()) {
                    accessibilites.add(acc+"_"+prefix);
                }
            }
        }
        return accessibilites;
    }

    public List<RoleApp> allRoleSystems() {
        return permissionSystem.getRoles();
    }

    public List<RoleApp> allRoleTask() {
        return permissionTask.getRoles();
    }

    public Optional<RoleApp> getRoleSystemByName(String roleName) {
        return allRoleSystems().stream()
                .filter(role -> role.getName().equals(roleName))
                .findFirst();
    }

    public Optional<RoleApp> getRoleTaskByName(String roleName) {
        return allRoleTask().stream()
                .filter(role -> role.getName().equals(roleName))
                .findFirst();
    }

    public List<MemberGroupe> loadGroupeMember(String userId) {
        return  memberGroupeRepository.findByUserId(userId);
    }
    public Accessibility getAccessibility( UserDetailsDeto userDetails){
        Accessibility accessibility = new Accessibility();
        Set<String> routes = new HashSet<>();
        Map<String , ModuleMenue> moduleMenue = new HashMap<>();
        ModuleMenue installation = filterAccessible(configMenue.getInstallations(),userDetails);
        ModuleMenue privateMenue = filterAccessible(configMenue.getPrivateMenue(), userDetails);
        ModuleMenue creationProjet = filterAccessible(configMenue.getCreationProject(), userDetails);
        if (installation !=null) {
            moduleMenue.put(installation.getRoute(),installation);
            installation.getMenues().forEach( menuApp -> {
                routes.add(installation.getRoute()+menuApp.getPath());
            });
        }

        if(creationProjet !=null) {
            moduleMenue.put(creationProjet.getRoute(),creationProjet);
            creationProjet.getMenues().forEach( menuApp -> {
                routes.add(creationProjet.getRoute()+menuApp.getPath());
            });
        }
        if(creationProjet !=null) {
            moduleMenue.put(privateMenue.getRoute(),privateMenue);
            privateMenue.getMenues().forEach( menuApp -> {
                routes.add(privateMenue.getRoute()+menuApp.getPath());
                routes.add(installation.getRoute()+menuApp.getPath());
            });
        }
        accessibility.setRoutes(routes);
        accessibility.setModuleMenues(moduleMenue);
        return accessibility;
    }
    public ModuleMenue filterAccessible(ModuleMenue moduleMenue, UserDetailsDeto userDetails){
        List<MenuApp> menus = moduleMenue.getMenues().stream().filter( menuApp -> {
            return menuApp.getCredancials().stream()
                    .anyMatch(userDetails.getPermissions()::contains);
        }).collect(Collectors.toList());
        ModuleMenue newModule = new ModuleMenue();
        if (CollectionUtils.isEmpty(menus)) {
            return null;
        }
        newModule.setMenues(menus);
        newModule.setRoute(moduleMenue.getRoute());
     return newModule;
    }
}
