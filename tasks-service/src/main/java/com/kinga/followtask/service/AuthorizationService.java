package com.kinga.followtask.service;

import com.kinga.followtask.config.*;
import com.kinga.followtask.dto.Accessibility;
import com.kinga.followtask.dto.UserDetailsDeto;
import com.kinga.followtask.entity.GroupeUser;
import com.kinga.followtask.entity.MemberGroupe;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.GroupeUserRepository;
import com.kinga.followtask.repository.MemberGroupeRepository;
import com.kinga.followtask.repository.UserRepository;
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
    private final UserRepository userRepository;

    public List<MemberGroupe> addStandarUser(UserApp userApp) {
        MemberGroupe memberGroupe = new MemberGroupe();
        memberGroupe.setGroupe(systemGroupe());
        memberGroupe.setUser(userApp);
        memberGroupe.setRoles(Arrays.asList ("STANDARD_USER"));
        memberGroupeRepository.save(memberGroupe);
        return memberGroupeRepository.findByUserId(userApp.getId());
    }

    public List<MemberGroupe> addUserToAdminSystem(UserApp userApp) {
        MemberGroupe memberGroupe = null;
        List<MemberGroupe> memberGroupes = memberGroupeRepository.findByUserIdAndGroupeType(userApp.getId(), GroupeUser.SYSTEM_GROUPE);
        if (!CollectionUtils.isEmpty(memberGroupes)) {
            memberGroupe = memberGroupes.get(0);
        } else {
            memberGroupe = new MemberGroupe();
            memberGroupe.setUser(userApp);
            memberGroupe.setGroupe(systemGroupe());
        }
        memberGroupe.setRoles(Arrays.asList ("SYSTEM_ADMIN"));
        memberGroupeRepository.save(memberGroupe);
        return memberGroupeRepository.findByGroupeIdAndUserId(memberGroupe.getGroupe().getId(), userApp.getId());
    }
    public MemberGroupe addUserInGroupe(String username , Long groupeId, List<String> roles) {
        UserApp userApp = userRepository.findByUsername (username);
        List<MemberGroupe> members = memberGroupeRepository.findByGroupeIdAndUserId (groupeId, userApp.getId ());
        MemberGroupe memberGroupe = null;
        if (!CollectionUtils.isEmpty (members)) {
            memberGroupe = members.get (0);
        } else {
            memberGroupe = new MemberGroupe ();
            memberGroupe.setGroupe (groupeUserRepository.getById (groupeId));
            memberGroupe.setUser (userApp);
        }
        memberGroupe.setRoles (roles);
        return memberGroupeRepository.save (memberGroupe);
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
        List<GroupeUser> systemGroupes = groupeUserRepository.findByType(GroupeUser.SYSTEM_GROUPE);
        if (!CollectionUtils.isEmpty(systemGroupes))
            return systemGroupes.get(0);
        GroupeUser systemGroupe = new GroupeUser();
        systemGroupe.setType(GroupeUser.SYSTEM_GROUPE);
        systemGroupe.setName("Accessibilité au systeme ");
        return groupeUserRepository.save(systemGroupe);
    }

    public Set<String> buildAccessibilities(UserApp userApp) {
        Set<String> accessibilites = new HashSet<>();
        List<MemberGroupe> systems = memberGroupeRepository.findByUserIdAndGroupeType(userApp.getId(), GroupeUser.SYSTEM_GROUPE);
        if (!CollectionUtils.isEmpty(systems)) {
            for (MemberGroupe memberGroupe : systems) {
                for(String r : memberGroupe.getRoles ()) {
                    Optional<RoleApp> role = getRoleSystemByName(r);
                    if (!role.isPresent() || CollectionUtils.isEmpty(role.get().getAccessibilities())) {
                        continue;
                    }
                    for (String acc : role.get().getAccessibilities()) {
                        accessibilites.add(acc);
                    }
                }

            }
        }
        // TODO : Accessibility for travail a aprofondir
        List<MemberGroupe> projectGroupe = memberGroupeRepository.findByUserIdAndGroupeType(userApp.getId(), GroupeUser.PROJECT_GROUPE);
        if (!CollectionUtils.isEmpty(projectGroupe)) {
            for (MemberGroupe memberGroupe : projectGroupe) {
                String prefix = memberGroupe.getGroupe().getPrefix();
                for (String r : memberGroupe.getRoles ()){
                    Optional<RoleApp> role = getRoleTaskByName(r);
                    if (!role.isPresent() || CollectionUtils.isEmpty(role.get().getAccessibilities())) {
                        continue;
                    }
                    for (String acc : role.get().getAccessibilities()) {
                        accessibilites.add(prefix+"_"+acc);
                    }
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
