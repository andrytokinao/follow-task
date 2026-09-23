package com.kinga.followtask.service.messaging;

import com.kinga.followtask.entity.TypeCanal;
import com.kinga.followtask.service.messaging.dto.MessageDto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Lecture des conversations privees d'un canal, par opposition aux groupes que
 * couvre {@link MessagingService}.
 *
 * <p>Contrat separe et non ajoute a {@link MessagingService} : seuls les canaux
 * capables de lire une conversation de personne a personne l'implementent. Un
 * fournisseur qui ne sait gerer que des groupes n'a pas a porter une methode
 * qu'il ne saurait honorer.</p>
 */
public interface DirectMessageReader {

    /** Type de canal gere par cette implementation. */
    TypeCanal getType();

    /**
     * Messages recus en conversation privee depuis l'instant donne, les
     * messages emis par le compte du systeme etant exclus.
     */
    List<MessageDto> recentDirectMessages(LocalDateTime since);
}
