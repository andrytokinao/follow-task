package com.kinga.followtask.config;

import com.kinga.followtask.entity.RegleNotification;
import com.kinga.followtask.entity.Status;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Statuts dont l'atteinte mérite une notification.
 *
 * Tout changement de statut prévenait les observateurs, y compris les passages
 * intermédiaires — « Ouvert » vers « En cours », puis « En attente », puis
 * « En cours » à nouveau. Le bruit noyait les évènements qui demandent
 * vraiment une action. Seuls les statuts de fin de traitement notifient
 * désormais ; les autres restent tracés dans l'historique de la tâche, qui
 * doit rester complet.
 *
 * La liste est un réglage : chaque installation nomme ses statuts comme elle
 * l'entend. Elle se règle dans application.properties :
 *
 * <pre>notification.statuts-finaux=Corrige,Resolu,Termine,Livre</pre>
 *
 * La comparaison porte sur le libellé et non sur l'identifiant : un même
 * statut existe autant de fois qu'il y a de workflows, avec un identifiant
 * différent à chaque fois. Accents et casse sont ignorés, pour qu'un réglage
 * saisi « corrige » reconnaisse « Corrigé ».
 *
 * Le réglage s'écrit sans accents : application.properties est lu en
 * ISO-8859-1, et un « Corrigé » enregistré en UTF-8 y devient « CorrigÃ© »,
 * qui ne reconnaît plus rien.
 */
@Component
public class StatutsFinaux implements RegleNotification {

    private static final Logger logger = LoggerFactory.getLogger(StatutsFinaux.class);

    private final List<String> configures;
    private Set<String> normalises = Collections.emptySet();

    public StatutsFinaux(
            @Value("${notification.statuts-finaux:Corrigé,Résolu,Terminé}") List<String> configures) {
        this.configures = configures;
    }

    @PostConstruct
    void preparer() {
        Set<String> libelles = new LinkedHashSet<>();
        if (configures != null) {
            configures.stream()
                    .map(this::normaliser)
                    .filter(s -> !s.isEmpty())
                    .forEach(libelles::add);
        }
        this.normalises = libelles;
        if (libelles.isEmpty()) {
            // Liste vidée volontairement : plus aucun changement de statut ne
            // notifie. On le dit, sinon le silence passerait pour une panne.
            logger.warn("notification.statuts-finaux est vide : aucun changement de statut ne sera notifié");
            return;
        }
        logger.info("Statuts notifiés à l'atteinte : {}", configures);
    }

    /** Un statut absent ou sans libellé ne peut pas être reconnu comme final. */
    @Override
    public boolean estStatutFinal(Status status) {
        if (status == null || status.getDisplayName() == null) {
            return false;
        }
        return normalises.contains(normaliser(status.getDisplayName()));
    }

    /** Minuscules, sans accents, sans espaces superflus. */
    private String normaliser(String valeur) {
        if (valeur == null) {
            return "";
        }
        String sansAccent = Normalizer.normalize(valeur.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sansAccent.toLowerCase();
    }
}
