package com.kinga.followtask.service;

import com.kinga.followtask.dto.*;
import com.kinga.followtask.entity.*;
import com.kinga.followtask.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.*;

import static com.kinga.followtask.service.ChatService.SLIDE_DOSSIER;

@Service
@RequiredArgsConstructor
public class ActionService {

    private final ActionItemRepository actionItemRepository;
    private final ActionGroupeRepository actionGroupeRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final UploadedRepository uploadedRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final StatusRepository statusRepository;
    private final ProjectService projectService;
    private final GroupeUserRepository groupeUserRepository;
    private static List<String> slides = Arrays.asList(

    );

    private static int currentIndex = 0;

    /**
     * La rédaction, l'enregistrement et la distribution sont désormais tenus
     * par NotificationService : c'est lui qui garantit que rien ne part sur le
     * websocket avant le commit.
     */
    public void generateAndSendNotification(ActionGroupe actionGroupe, Set<String> specificUsers) {
        notificationService.generateAndSend(actionGroupe, specificUsers);
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
        ceateAssigneAction(userId, issue, issue.getAssigne());
    }

    public void ceateAssigneAction(String userId,Issue issue, UserApp assigne) {
        ActionGroupe actionGroupe = new ActionGroupe();
        actionGroupe.setIssue(issue);
        actionGroupe.setCreated(new Date());
        // Un UserApp reduit a son identifiant suffisait pour la cle etrangere,
        // mais le message de notification y lit aussi le nom de l'auteur : sans
        // relecture, la phrase commencait par « Quelqu'un ».
        actionGroupe.setUser(chargerUtilisateur(userId));
        actionGroupe = actionGroupeRepository.save(actionGroupe);
        ActionAssigne actonItem= new ActionAssigne();
        actonItem.setAssigne(assigne);
        actonItem.setIssue(issue);
        actonItem.setActionGroupe(actionGroupe);
        actonItem = actionItemRepository.save(actonItem);
        List<ActionItem> actionItemList = new ArrayList<>();
        actionItemList.add(actonItem);
        actionGroupe.setActions(actionItemList);
        generateAndSendNotification(actionGroupe, actionGroupe.userSpecificToNotifies());
    }

    /**
     * L'action demandee laisserait-elle l'issue dans l'etat ou elle est deja ?
     *
     * Seuls les deux types qui modifient l'issue sont concernes. Un type
     * inconnu n'est jamais considere comme sans effet : mieux vaut un
     * enregistrement de trop qu'une action perdue en silence.
     */
    private boolean sansEffet(ActionItem actionItem, Issue issue) {
        switch (actionItem.getActionType()) {
            case STATUS -> {
                return memeStatut(issue.getStatus(), ((ActionStatus) actionItem).getStatus());
            }
            case ASSIGN -> {
                return memeUtilisateur(issue.getAssigne(), ((ActionAssigne) actionItem).getAssigne());
            }
            default -> {
                return false;
            }
        }
    }

    private boolean memeStatut(Status actuel, Status demande) {
        if (actuel == null || demande == null) {
            // Poser un statut la ou il n'y en avait pas est un vrai changement ;
            // deux absences ne sont rien a enregistrer.
            return actuel == null && demande == null;
        }
        return Objects.equals(actuel.getId(), demande.getId());
    }

    private boolean memeUtilisateur(UserApp actuel, UserApp demande) {
        if (actuel == null || demande == null) {
            return actuel == null && demande == null;
        }
        return actuel.getId() != null && actuel.getId().equalsIgnoreCase(demande.getId());
    }

    private UserApp chargerUtilisateur(String userId) {
        if (userId == null) {
            return null;
        }
        UserApp charge = userRepository.findById(userId).orElse(null);
        if (charge != null) {
            return charge;
        }
        UserApp stub = new UserApp();
        stub.setId(userId);
        return stub;
    }

    public ActionItem saveAction(ActionItemInput action) {
        ActionItem actionItem = ActionItem.fromInput(action);
        if (actionItem == null) {
            return null;
        }
        ActionGroupe actionGroupe = actionItem.getActionGroupe();
        actionItem.setActionGroupe(actionGroupe);
        Issue issue = actionGroupe.getIssue();
        issue = issueRepository.getById(issue.getId());
        issue.setProject(issue.getProject());
        actionGroupe.setIssue(issue);

        // Rien n'a bouge : on n'enregistre rien. Reposer le statut courant
        // — « En cours » vers « En cours », au clic sur la valeur deja active
        // ou au depot d'une carte dans sa propre colonne — creait un groupe
        // d'actions, une ligne d'historique et une notification annoncant un
        // changement qui n'a pas eu lieu. Le controle est ici, et pas
        // seulement dans l'interface, parce que l'issue relue en base est la
        // seule reference fiable : la copie du client peut etre perimee.
        if (sansEffet(actionItem, issue)) {
            return null;
        }

        // L'entree ne porte que les identifiants ; le message de notification
        // a besoin des noms de l'auteur et de l'assigne.
        if (actionGroupe.getUser() != null) {
            actionGroupe.setUser(chargerUtilisateur(actionGroupe.getUser().getId()));
        }
        actionGroupe = actionGroupeRepository.save(actionGroupe);
        switch (actionItem.getActionType()) {
            case ASSIGN ->{
                ActionAssigne actionAssigne = (ActionAssigne) actionItem;
                if (actionAssigne.getAssigne() != null) {
                    actionAssigne.setAssigne(chargerUtilisateur(actionAssigne.getAssigne().getId()));
                }
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
        map.put(ChatService.PROCESS_ACTION,new ActionItemInput(action));
        for (String toNotifyItem : members) {
            simpMessagingTemplate.convertAndSend("/topic/datas/" + toNotifyItem, map);
        }
    }

    public Set<String> getMembers(String prefix) {
        List<GroupeUser> groups = new ArrayList<>();

        if (!StringUtils.isEmpty(prefix)) {
            groups = projectService.getGroupeUserForProject(prefix);
        } else {
           groups = groupeUserRepository.findAll();
        }
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
    public Fichier getSlideImage(String path, Integer numero, String action) throws IOException {
        if (numero == null)
            numero = 0;

        Dossier dossier = new Dossier(path);
        dossier.listDirectory(path);
        List<Repertoire> repertoires =  dossier.getRepertoires();
        List<Fichier> fichiers = new ArrayList<>();

        if (CollectionUtils.isEmpty(repertoires))
            return null;

        for (Repertoire repertoire : repertoires) {
            if (repertoire instanceof Fichier) {
                fichiers.add((Fichier) repertoire);
            }
        }
        if (CollectionUtils.isEmpty(fichiers))
            return null;
        numero = (numero + 1) % fichiers.size();
        Fichier fichier = fichiers.get(numero);
        fichier.setFileName(action);
        Map<String, Object> map = new HashMap<>();
        map.put(SLIDE_DOSSIER,fichier);

        fichier.setType(numero.toString());
        fichier.setPath(path);


        Set<String> members = getMembers("");

        if (CollectionUtils.isEmpty(members))
            return null;
        for (String toNotifyItem : members) {
            simpMessagingTemplate.convertAndSend("/topic/datas/" + toNotifyItem, map);
        }
        return fichier;
    }
    public void deleteAction(ActionItem action){
        this.actionItemRepository.delete(action);
    }

    public void deleteActionGroupe(ActionGroupe ag) {
        ag.getActions().forEach(actionItem -> {
            deleteAction(actionItem);
        });
        ag.getNotifications().forEach(n->{
            notificationRepository.delete(n);
        });
        actionGroupeRepository.delete(ag);
    }
}
