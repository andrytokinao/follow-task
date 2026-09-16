package com.kinga.followtask.config;

import com.kinga.followtask.entity.GlobalSettings;
import com.kinga.followtask.entity.Notification;
import com.kinga.followtask.repository.GlobalSettingsRepository;
import com.kinga.followtask.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Set;

/**
 * Reprise, une seule fois, des notifications créées avant que l'état « lu »
 * n'existe.
 *
 * La colonne readUserIds était déclarée mais jamais renseignée. En la mettant
 * en service, tout l'historique est devenu « non lu » d'un coup : chaque
 * ancienne notification rallumait une pastille de menu et venait s'ajouter aux
 * infobulles, à côté de l'évènement du jour. L'utilisateur voyait alors deux
 * lignes disant la même chose, l'une d'aujourd'hui, l'autre d'il y a deux
 * semaines et rédigée dans l'ancien format anglais.
 *
 * Ce qui est fait ici, et pourquoi c'est sans perte :
 *
 * - readUserIds est renseigné pour tous les destinataires des notifications
 *   existantes. On ne détruit rien — cette colonne n'a jamais rien contenu ;
 *   on choisit simplement sa valeur initiale. « Déjà traité » est le choix
 *   prudent : marquer tout l'historique « non lu » ferait crier des pastilles
 *   pour des évènements que personne n'a plus à traiter.
 *
 * - seenUserIds n'est PAS touché. C'est lui qui pilote le compteur de la
 *   cloche, dont le comportement ne change pas : ce qui n'avait pas été vu
 *   reste à voir.
 *
 * - Le titre « Test Notification » et les messages de l'ancien format
 *   (« Assigne tt-1 to  You ») sont réécrits depuis le groupe d'actions, qui
 *   porte toujours la donnée d'origine. La réécriture n'a lieu que si elle
 *   produit un texte non vide : à défaut, l'ancien message est conservé.
 */
@Component
@RequiredArgsConstructor
@Order(100)
public class NotificationHistoriqueReprise implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(NotificationHistoriqueReprise.class);

    /** Clé du marqueur en base : la reprise ne doit jouer qu'une fois. */
    static final String CLE_MARQUEUR = "notifications.reprise.lecture";

    /** Titre posé par l'ancien code sur toutes les notifications. */
    private static final String ANCIEN_TITRE = "Test Notification";

    private final NotificationRepository notificationRepository;
    private final GlobalSettingsRepository globalSettingsRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (!globalSettingsRepository.findByActiveAndCle(true, CLE_MARQUEUR).isEmpty()) {
            return;
        }

        List<Notification> historique = notificationRepository.findAll();
        int marquees = 0;
        int reecrites = 0;

        for (Notification notification : historique) {
            boolean modifiee = false;

            Set<String> destinataires = notification.getUserIds();
            for (String userId : destinataires) {
                if (userId != null && !userId.isBlank() && !notification.isReadBy(userId)) {
                    notification.getReadUserIds().add(userId);
                    modifiee = true;
                }
            }
            if (modifiee) {
                marquees++;
            }
            if (reecrire(notification)) {
                reecrites++;
                modifiee = true;
            }
            if (modifiee) {
                notificationRepository.save(notification);
            }
        }

        GlobalSettings marqueur = new GlobalSettings();
        marqueur.setCle(CLE_MARQUEUR);
        marqueur.setSettingsValue(historique.size() + " notification(s) reprises");
        marqueur.setActive(true);
        marqueur.setCreated(new Date());
        globalSettingsRepository.save(marqueur);

        logger.info("Reprise de l'historique des notifications : {} marquée(s) lue(s), {} texte(s) réécrit(s) sur {}",
                marquees, reecrites, historique.size());
    }

    /**
     * Réécrit titre et message depuis le groupe d'actions. Pour une
     * notification à destinataire unique on rédige de son point de vue
     * (« vous a assigné »), comme le fait le code courant ; au-delà, la
     * formulation neutre est la seule qui convienne à tous.
     */
    private boolean reecrire(Notification notification) {
        if (notification.getAction() == null) {
            return false;
        }
        boolean ancienFormat = notification.getTitre() == null
                || notification.getTitre().isBlank()
                || ANCIEN_TITRE.equals(notification.getTitre());
        if (!ancienFormat) {
            return false;
        }
        Set<String> destinataires = notification.getUserIds();
        String pointDeVue = destinataires.size() == 1 ? destinataires.iterator().next() : null;

        String message;
        String titre;
        try {
            message = notification.getAction().buildMessage(pointDeVue);
            titre = notification.getAction().buildTitle();
        } catch (Exception e) {
            // Une action orpheline ou incomplète ne doit pas faire échouer le
            // démarrage : on laisse la notification telle quelle.
            logger.debug("Notification {} non réécrite : {}", notification.getId(), e.getMessage());
            return false;
        }
        if (message == null || message.isBlank()) {
            return false;
        }
        notification.setMessage(message);
        notification.setTitre(titre);
        return true;
    }
}
