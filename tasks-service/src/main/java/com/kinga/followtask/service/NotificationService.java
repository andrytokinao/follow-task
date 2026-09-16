package com.kinga.followtask.service;

import com.kinga.followtask.dto.OutputNotification;
import com.kinga.followtask.dto.Response;
import com.kinga.followtask.entity.ActionGroupe;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.Notification;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Fabrique, persiste et distribue les notifications.
 *
 * Deux garanties tiennent tout le reste :
 *
 * 1. On n'émet jamais sur le websocket avant que la transaction ait commité.
 *    Le courtier STOMP simple ne conserve rien : un client qui recevait
 *    l'évènement puis rechargeait la liste tombait sur une base qui n'avait
 *    pas encore vu la notification, et affichait une pastille sans contenu. Si
 *    la transaction échouait, il gardait même une notification fantôme.
 *
 * 2. Le websocket n'est qu'une accélération, jamais la source de vérité. Tout
 *    ce qui part en direct est relisible par getNotificationsByUserId : un
 *    client déconnecté au mauvais moment retrouve son état en rechargeant.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    /** Clés de la charge utile websocket, reconnues par le front. */
    public static final String NEW_NOTIFICATION = ChatService.NEW_NOTIFICATION;
    public static final String NOTIFICATION_READ = "notificationRead";

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;

    // -----------------------------------------------------------------
    // Création
    // -----------------------------------------------------------------

    /**
     * Crée les notifications d'un groupe d'actions.
     *
     * Les destinataires « spécifiques » (le nouvel assigné, par exemple)
     * reçoivent un message rédigé pour eux — « vous a assigné » plutôt que
     * « a assigné à X » — et sont retirés de l'envoi collectif pour ne pas
     * recevoir deux fois le même évènement.
     */
    public List<Notification> generateAndSend(ActionGroupe actionGroupe, Set<String> specificUsers) {
        List<Notification> creees = new ArrayList<>();
        Set<String> tous = actionGroupe.userToNotifies();

        // Un destinataire direct — le nouvel assigné — est notifié qu'il
        // figure ou non dans les observateurs de la tâche. La colonne
        // observerIds est bornée : quand elle est pleine, l'assigné n'y entre
        // pas, et le faire dépendre d'elle revenait à priver de notification
        // celui-là même que l'action concerne.
        String auteurId = actionGroupe.getUser() == null ? null : actionGroupe.getUser().getId();
        Set<String> specifiques = new HashSet<>();
        if (!CollectionUtils.isEmpty(specificUsers)) {
            specificUsers.stream()
                    .filter(u -> u != null && !u.isBlank())
                    .filter(u -> auteurId == null || !u.equalsIgnoreCase(auteurId))
                    .forEach(specifiques::add);
        }
        if (CollectionUtils.isEmpty(tous) && specifiques.isEmpty()) {
            return creees;
        }

        for (String userId : specifiques) {
            Notification notification = create(actionGroupe, Set.of(userId), userId);
            if (notification != null) {
                creees.add(notification);
            }
        }
        // Les destinataires directs ont déjà reçu leur version personnalisée :
        // les laisser dans l'envoi collectif leur enverrait deux fois le même
        // évènement, une fois « vous a assigné » et une fois « a assigné à ».
        Set<String> collectif = tous.stream()
                .filter(u -> specifiques.stream().noneMatch(u::equalsIgnoreCase))
                .collect(Collectors.toSet());
        if (!collectif.isEmpty()) {
            Notification notification = create(actionGroupe, collectif, null);
            if (notification != null) {
                creees.add(notification);
            }
        }
        return creees;
    }

    /**
     * @param destinataires qui reçoit cette notification
     * @param redigePour    destinataire dont le point de vue rédige le message,
     *                      null pour une formulation neutre
     */
    private Notification create(ActionGroupe actionGroupe, Set<String> destinataires, String redigePour) {
        String message = actionGroupe.buildMessage(redigePour);
        if (message == null || message.isBlank()) {
            // Sans texte, la carte serait vide et la pastille inexplicable.
            return null;
        }
        Notification notification = new Notification();
        notification.setMessage(message);
        notification.setTitre(actionGroupe.buildTitle());
        notification.setAction(actionGroupe);
        notification.setUserIds(new HashSet<>(destinataires));
        notification.setProject(projetDe(actionGroupe));
        notification = notificationRepository.save(notification);

        OutputNotification charge = new OutputNotification(notification);
        pushApresCommit(destinataires, NEW_NOTIFICATION, charge);
        return notification;
    }

    private Project projetDe(ActionGroupe actionGroupe) {
        Issue issue = actionGroupe.getIssue();
        return issue == null ? null : issue.getProject();
    }

    // -----------------------------------------------------------------
    // Lecture
    // -----------------------------------------------------------------

    public List<Notification> findByUser(String userId) {
        return notificationRepository.findByUserId(userId);
    }

    /**
     * Marque « vu » : l'utilisateur a ouvert le panneau de la cloche. Cela
     * remet le compteur à zéro sans toucher aux pastilles des menus, qui ne
     * s'éteignent qu'une fois la tâche réellement ouverte.
     */
    public Response seen(String userId) {
        List<Notification> concernees = notificationRepository.findUnseens(userId);
        List<Long> ids = enregistrer(concernees, userId, false);
        diffuserLecture(userId, ids, false);
        return reponse("seenNotification", ids.size() + " notification(s) marquée(s) vue(s)");
    }

    /**
     * Marque « lu » les notifications de l'utilisateur portant sur une tâche.
     * C'est le geste qui éteint la pastille du menu Tâches, celle du menu
     * Projets et le fond de ligne, partout en même temps.
     */
    public Response readIssue(String userId, Long issueId) {
        if (issueId == null) {
            return reponse("readNotificationsByIssue", "Aucune tâche indiquée");
        }
        List<Notification> concernees = notificationRepository.findUnreads(userId).stream()
                .filter(n -> n.getIssue() != null && issueId.equals(n.getIssue().getId()))
                .collect(Collectors.toList());
        List<Long> ids = enregistrer(concernees, userId, true);
        diffuserLecture(userId, ids, true);
        return reponse("readNotificationsByIssue", ids.size() + " notification(s) marquée(s) lue(s)");
    }

    /**
     * Idem pour toutes les tâches d'une demande : ouvrir la demande vaut
     * lecture de ce qui s'est passé sur ses sous-tâches, sinon la pastille de
     * la demande resterait allumée sans ligne visible pour l'expliquer.
     */
    public Response readIssueTree(String userId, Long masterId) {
        if (masterId == null) {
            return reponse("readNotificationsByMaster", "Aucune demande indiquée");
        }
        List<Notification> concernees = notificationRepository.findUnreads(userId).stream()
                .filter(n -> concerneArbre(n.getIssue(), masterId))
                .collect(Collectors.toList());
        List<Long> ids = enregistrer(concernees, userId, true);
        diffuserLecture(userId, ids, true);
        return reponse("readNotificationsByMaster", ids.size() + " notification(s) marquée(s) lue(s)");
    }

    private boolean concerneArbre(Issue issue, Long masterId) {
        if (issue == null) {
            return false;
        }
        if (masterId.equals(issue.getId())) {
            return true;
        }
        return issue.getParent() != null && masterId.equals(issue.getParent().getId());
    }

    public Response readProject(String userId, Long projectId) {
        if (projectId == null) {
            return reponse("readNotificationsByProject", "Aucun projet indiqué");
        }
        List<Notification> concernees = notificationRepository.findUnreads(userId).stream()
                .filter(n -> n.getProject() != null && projectId.equals(n.getProject().getId()))
                .collect(Collectors.toList());
        List<Long> ids = enregistrer(concernees, userId, true);
        diffuserLecture(userId, ids, true);
        return reponse("readNotificationsByProject", ids.size() + " notification(s) marquée(s) lue(s)");
    }

    public Response readAll(String userId) {
        List<Notification> concernees = notificationRepository.findUnreads(userId);
        List<Long> ids = enregistrer(concernees, userId, true);
        diffuserLecture(userId, ids, true);
        return reponse("readAllNotifications", ids.size() + " notification(s) marquée(s) lue(s)");
    }

    private List<Long> enregistrer(List<Notification> notifications, String userId, boolean lue) {
        List<Long> ids = new ArrayList<>();
        for (Notification notification : notifications) {
            boolean change = lue ? notification.markRead(userId) : notification.markSeen(userId);
            if (change) {
                notificationRepository.save(notification);
                ids.add(notification.getId());
            }
        }
        return ids;
    }

    /**
     * Le même utilisateur peut avoir plusieurs onglets ou appareils ouverts.
     * Sans cet écho, marquer lu ici laisserait la pastille allumée là-bas
     * jusqu'au prochain rechargement.
     */
    private void diffuserLecture(String userId, List<Long> ids, boolean lue) {
        if (ids.isEmpty()) {
            return;
        }
        Map<String, Object> charge = new HashMap<>();
        charge.put("userId", userId);
        charge.put("ids", ids);
        charge.put("read", lue);
        pushApresCommit(Set.of(userId), NOTIFICATION_READ, charge);
    }

    private Response reponse(String code, String message) {
        Response response = new Response();
        response.setCode(code);
        response.setStatus("success");
        response.setMessage(message);
        return response;
    }

    // -----------------------------------------------------------------
    // Distribution
    // -----------------------------------------------------------------

    /**
     * Publie sur le canal personnel de chaque destinataire, une fois la
     * transaction en cours validée. Hors transaction, l'envoi est immédiat.
     */
    public void pushApresCommit(Collection<String> userIds, String cle, Object charge) {
        if (CollectionUtils.isEmpty(userIds) || charge == null) {
            return;
        }
        Map<String, Object> message = new HashMap<>();
        message.put(cle, charge);
        Set<String> destinataires = new HashSet<>(userIds);

        // Le test porte sur isActualTransactionActive(), surtout pas sur
        // isSynchronizationActive() seul.
        //
        // spring.jpa.open-in-view est actif (valeur par défaut) : l'intercepteur
        // lie un EntityManager à toute la requête et active la synchronisation
        // *sans ouvrir de transaction*. Sur les chemins non annotés
        // @Transactional — saveAction, addDocumentAction — la synchronisation
        // répondait donc « oui » alors qu'aucune transaction n'allait jamais
        // commiter : la callback afterCommit n'était jamais appelée et la
        // notification, pourtant enregistrée en base, ne partait pas sur le
        // websocket. Elle n'apparaissait qu'au rechargement de la page.
        boolean differable = TransactionSynchronizationManager.isActualTransactionActive()
                && TransactionSynchronizationManager.isSynchronizationActive();
        if (!differable) {
            logger.debug("Notification {} envoyée immédiatement (hors transaction) à {} destinataire(s)",
                    cle, destinataires.size());
            push(destinataires, message);
            return;
        }
        logger.debug("Notification {} différée au commit pour {} destinataire(s)", cle, destinataires.size());
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                push(destinataires, message);
            }

            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    // Sans cette trace, un rollback se traduisait par un silence
                    // impossible à distinguer d'un websocket coupé.
                    logger.warn("Transaction non validée (statut {}) : notification {} non distribuée",
                            status, cle);
                }
            }
        });
    }

    private void push(Set<String> destinataires, Map<String, Object> message) {
        // Trace volontairement en INFO : quand une notification « n'arrive
        // pas », c'est la première chose à savoir — le serveur a-t-il émis, ou
        // le client n'a-t-il pas reçu ? Sans cette ligne, les deux pannes se
        // ressemblent.
        logger.info("Emission {} vers {}", message.keySet(), destinataires);
        for (String userId : destinataires) {
            if (userId == null || userId.isBlank()) {
                continue;
            }
            try {
                simpMessagingTemplate.convertAndSend("/topic/datas/" + userId, message);
            } catch (Exception e) {
                // Un destinataire injoignable ne doit pas priver les autres :
                // la donnée est en base, le client la retrouvera au rechargement.
                logger.warn("Notification non distribuée à {} : {}", userId, e.getMessage());
            }
        }
    }
}
