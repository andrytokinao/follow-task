package com.kinga.followtask.service;

import com.kinga.followtask.dto.WhatsAppLinkStateDto;
import com.kinga.followtask.entity.Contact;
import com.kinga.followtask.entity.TypeCanal;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.WhatsAppLinkRequest;
import com.kinga.followtask.entity.enumapp.TypeContact;
import com.kinga.followtask.repository.ContactRepository;
import com.kinga.followtask.repository.WhatsAppLinkRequestRepository;
import com.kinga.followtask.service.messaging.DirectMessageReader;
import com.kinga.followtask.service.messaging.dto.MessageDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Rattachement d'un compte WhatsApp a un utilisateur.
 *
 * <p>Le sens de l'echange est impose par WhatsApp : c'est l'utilisateur qui
 * ecrit au numero du systeme, jamais le contraire. Un compte qui aborde des
 * inconnus se fait suspendre. Le code n'est donc pas un secret expedie a
 * l'utilisateur mais un jeton qu'il rapporte depuis son propre telephone —
 * preuve, du meme coup, qu'il controle bien ce numero.</p>
 *
 * <p>Aucun message n'est emis par le systeme pendant ce parcours.</p>
 */
@Slf4j
@Service
public class WhatsAppAccountLinkService {

    /** Sans I, O, 0 ni 1 : le code est recopie a la main depuis un ecran. */
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;
    private static final String CODE_PREFIX = "FT-";
    private static final int MAX_CODE_ATTEMPTS = 20;

    private final WhatsAppLinkRequestRepository linkRequestRepository;
    private final ContactRepository contactRepository;
    /** Absent si aucun canal ne sait lire les conversations privees. */
    private final Optional<DirectMessageReader> directMessageReader;
    private final SecureRandom random = new SecureRandom();

    @Value("${messaging.whatsapp.link.service-number}")
    private String serviceNumber;

    @Value("${messaging.whatsapp.link.code-validity-minutes:30}")
    private int codeValidityMinutes;

    public WhatsAppAccountLinkService(WhatsAppLinkRequestRepository linkRequestRepository,
                                      ContactRepository contactRepository,
                                      List<DirectMessageReader> readers) {
        this.linkRequestRepository = linkRequestRepository;
        this.contactRepository = contactRepository;
        this.directMessageReader = readers.stream()
                .filter(reader -> reader.getType() == TypeCanal.WHATSAPP)
                .findFirst();
    }

    // -----------------------------------------------------------------
    // Lecture
    // -----------------------------------------------------------------

    /** Etat affiche par le profil : compte rattache, ou code en attente, ou rien. */
    @Transactional(readOnly = true)
    public WhatsAppLinkStateDto currentState(UserApp user) {
        WhatsAppLinkStateDto.WhatsAppLinkStateDtoBuilder etat = WhatsAppLinkStateDto.builder()
                .serviceNumber(serviceNumber)
                .codeValidityMinutes(codeValidityMinutes);

        Contact rattache = findLinkedContact(user);
        if (rattache != null) {
            return etat.linked(true)
                    .linkedValue(rattache.getValue())
                    .linkedDisplayName(rattache.getDisplayName())
                    .build();
        }

        linkRequestRepository.findFirstByUserAppIdAndConsumedAtIsNullOrderByCreatedAtDesc(user.getId())
                .filter(demande -> demande.isPending(LocalDateTime.now()))
                .ifPresent(demande -> etat.pendingCode(demande.getCode())
                        .pendingExpiresAt(demande.getExpiresAt().toString()));
        return etat.linked(false).build();
    }

    // -----------------------------------------------------------------
    // Ecriture
    // -----------------------------------------------------------------

    /**
     * Ouvre une demande de rattachement et rend le code a envoyer. Une demande
     * deja en cours est rendue telle quelle : redemander un code ne doit pas
     * invalider celui que l'utilisateur est peut-etre en train de recopier.
     */
    @Transactional
    public WhatsAppLinkStateDto startLink(UserApp user) {
        if (findLinkedContact(user) != null) {
            throw new IllegalStateException("Un compte WhatsApp est déjà rattaché à ce profil");
        }
        LocalDateTime now = LocalDateTime.now();
        Optional<WhatsAppLinkRequest> enCours = linkRequestRepository
                .findFirstByUserAppIdAndConsumedAtIsNullOrderByCreatedAtDesc(user.getId())
                .filter(demande -> demande.isPending(now));
        if (enCours.isEmpty()) {
            WhatsAppLinkRequest demande = new WhatsAppLinkRequest();
            demande.setUserApp(user);
            demande.setCode(generateUniqueCode());
            demande.setCreatedAt(now);
            demande.setExpiresAt(now.plusMinutes(codeValidityMinutes));
            linkRequestRepository.save(demande);
        }
        return currentState(user);
    }

    /**
     * Cherche le code dans les conversations privees recues et rattache le
     * compte s'il y figure.
     *
     * <p>Interrogation a la demande, et non attente d'une notification : le
     * fournisseur externe ne pousse rien aujourd'hui. L'utilisateur declenche
     * la verification quand il a envoye son message.</p>
     */
    @Transactional
    public WhatsAppLinkStateDto verifyLink(UserApp user) {
        LocalDateTime now = LocalDateTime.now();
        WhatsAppLinkRequest demande = linkRequestRepository
                .findFirstByUserAppIdAndConsumedAtIsNullOrderByCreatedAtDesc(user.getId())
                .filter(enCours -> enCours.isPending(now))
                .orElseThrow(() -> new IllegalStateException(
                        "Aucun code en cours : demandez-en un nouveau"));

        DirectMessageReader reader = directMessageReader.orElseThrow(() -> new IllegalStateException(
                "La lecture des messages WhatsApp n'est pas disponible pour le moment"));

        MessageDto porteur = reader.recentDirectMessages(demande.getCreatedAt()).stream()
                .filter(message -> contientCode(message, demande.getCode()))
                .findFirst()
                .orElse(null);

        if (porteur == null) {
            return currentState(user);
        }
        rattacher(user, demande, porteur, now);
        return currentState(user);
    }

    /** Detache le compte : le contact perd son utilisateur et sa verification. */
    @Transactional
    public WhatsAppLinkStateDto unlink(UserApp user) {
        Contact rattache = findLinkedContact(user);
        if (rattache != null) {
            rattache.setUserApp(null);
            rattache.setVerified(false);
            contactRepository.save(rattache);
        }
        return currentState(user);
    }

    // -----------------------------------------------------------------
    // Interne
    // -----------------------------------------------------------------

    private void rattacher(UserApp user, WhatsAppLinkRequest demande, MessageDto porteur, LocalDateTime now) {
        String jid = porteur.getCanalExternalId();
        Contact contact = contactRepository.findByTypeContactAndValue(TypeContact.WHATSAPP, jid)
                .orElseGet(() -> {
                    Contact nouveau = new Contact();
                    nouveau.setTypeContact(TypeContact.WHATSAPP);
                    nouveau.setValue(jid);
                    nouveau.setCreatedAt(now);
                    return nouveau;
                });
        contact.setUserApp(user);
        contact.setVerified(true);
        if (!StringUtils.hasText(contact.getDisplayName())) {
            contact.setDisplayName(porteur.getSenderDisplayName());
        }
        contactRepository.save(contact);

        demande.setConsumedAt(now);
        demande.setLinkedJid(jid);
        linkRequestRepository.save(demande);
        log.info("Compte WhatsApp {} rattaché à l'utilisateur {}", jid, user.getUsername());
    }

    /**
     * Le code est cherche sans tenir compte de la casse ni des espaces : il est
     * recopie a la main, souvent accompagne d'un mot de politesse.
     */
    private boolean contientCode(MessageDto message, String code) {
        if (!StringUtils.hasText(message.getText())) {
            return false;
        }
        String texte = message.getText().toUpperCase().replaceAll("\\s+", "");
        return texte.contains(code.toUpperCase().replaceAll("\\s+", ""));
    }

    private Contact findLinkedContact(UserApp user) {
        return contactRepository.findVerifiedByUser(user.getId(), TypeContact.WHATSAPP)
                .stream()
                .findFirst()
                .orElse(null);
    }

    /**
     * Code unique en base : deux utilisateurs qui enverraient le meme code
     * rendraient le rattachement ambigu.
     */
    private String generateUniqueCode() {
        for (int essai = 0; essai < MAX_CODE_ATTEMPTS; essai++) {
            String code = CODE_PREFIX + tirage();
            if (!linkRequestRepository.existsByCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Impossible de générer un code de rattachement");
    }

    private String tirage() {
        StringBuilder builder = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            builder.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }
        return builder.toString();
    }
}
