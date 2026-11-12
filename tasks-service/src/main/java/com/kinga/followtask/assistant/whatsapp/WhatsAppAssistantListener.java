package com.kinga.followtask.assistant.whatsapp;

import com.kinga.followtask.assistant.dto.ChatResponse;
import com.kinga.followtask.assistant.service.AssistantService;
import com.kinga.followtask.assistant.service.PendingActionService;
import com.kinga.followtask.assistant.whatsapp.dto.DirectMessageReceivedEvent;
import com.kinga.followtask.entity.Contact;
import com.kinga.followtask.entity.TypeCanal;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.TypeContact;
import com.kinga.followtask.repository.ContactRepository;
import com.kinga.followtask.repository.UserAppRepository;
import com.kinga.followtask.service.messaging.MessagingService;
import com.kinga.followtask.service.messaging.dto.SendMessageRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class WhatsAppAssistantListener {

    private static final Set<String> OUI = Set.of("oui", "eny", "ok", "confirmer", "yes");
    private static final Set<String> NON = Set.of("non", "tsia", "annuler", "no");
    private static final int MAX_LEN = 3500;
    private static final int MAX_TRACKED = 5000;
    private static final Duration LINK_CONFIRM_TTL = Duration.ofMinutes(10);

    private final ContactRepository contactRepository;
    private final UserAppRepository userAppRepository;
    private final AssistantService assistant;
    private final PendingActionService pending;
    private final List<MessagingService> messagingServices;

    @Value("${assistant.whatsapp.help-cooldown-hours:6}")
    private long helpCooldownHours;

    @Value("${app.public-url}")
    private String appUrl;

    /** Dernier message d'aide envoyé, par numéro. En mémoire : réinitialisé au redémarrage. */
    private final Map<String, Instant> lastHelp = new ConcurrentHashMap<>();

    /** Demandes de confirmation de liaison en attente, par numéro. En mémoire. */
    private final Map<String, PendingLink> pendingLinks = new ConcurrentHashMap<>();

    private record PendingLink(String userId, String displayName, Instant expiresAt) {
        boolean expired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    @Async
    @EventListener
    public void onDirectMessage(DirectMessageReceivedEvent e) {
        if (e.text() == null || e.text().isBlank()) return;

        String canalId = e.canalExternalId();
        String text = e.text().trim();

        Optional<Contact> contact = contactRepository
                .findByTypeContactAndExternalId(TypeContact.WHATSAPP, canalId);
        Optional<UserApp> user = contact.map(Contact::getUserApp);

        // Numéro inconnu, ou connu mais non lié à un compte
        if (user.isEmpty()) {
            handleUnlinked(canalId, text, contact);
            return;
        }
        // Compte désactivé : message neutre, sans détail
        if (!user.get().estActif()) {
            sendHelpOnce(canalId, helpInactive());
            return;
        }

        String userId = user.get().getId();
        try {
            send(canalId, handle(userId, text));
        } catch (Exception ex) {
            log.error("Assistant WhatsApp : échec pour user={}", userId, ex);
            send(canalId, "Désolé, une erreur est survenue. Réessayez dans un instant.");
        }
    }

    // ---------- Liaison automatique par numéro ----------

    private void handleUnlinked(String canalId, String text, Optional<Contact> existingContact) {
        String normalized = normalizeAnswer(text);

        // 1. Une confirmation est-elle en attente pour ce numéro ?
        PendingLink link = pendingLinks.get(canalId);
        if (link != null && link.expired()) {
            pendingLinks.remove(canalId);
            link = null;
        }
        if (link != null) {
            if (OUI.contains(normalized)) {
                pendingLinks.remove(canalId);
                confirmLink(canalId, link, existingContact);
                return;
            }
            if (NON.contains(normalized)) {
                pendingLinks.remove(canalId);
                send(canalId, "D'accord, ce numéro ne sera pas lié à ce compte.\n\n" + helpNotLinked());
                return;
            }
            // Réponse ambiguë : on repose la question
            send(canalId, confirmationQuestion(link.displayName()));
            return;
        }

        // 2. Chercher un compte dont le champ contact correspond à ce numéro
        List<UserApp> candidates = findCandidates(canalId);
        if (candidates.size() == 1 && candidates.get(0).estActif()) {
            UserApp u = candidates.get(0);
            String display = maskedName(u);
            if (pendingLinks.size() > MAX_TRACKED) {
                pendingLinks.entrySet().removeIf(en -> en.getValue().expired());
            }
            pendingLinks.put(canalId, new PendingLink(u.getId(), display, Instant.now().plus(LINK_CONFIRM_TTL)));
            send(canalId, confirmationQuestion(display));
            log.info("Demande de confirmation de liaison envoyée à {}", canalId);
            return;
        }

        // 3. Aucun candidat, plusieurs candidats ou compte inactif : guider sans révéler d'information
        sendHelpOnce(canalId, helpNotLinked());
    }

    @Transactional
    protected void confirmLink(String canalId, PendingLink link, Optional<Contact> existingContact) {
        try {
            UserApp u = userAppRepository.findById(link.userId()).orElse(null);
            if (u == null || !u.estActif()) {
                send(canalId, helpNotLinked());
                return;
            }
            Contact c = existingContact.orElseGet(Contact::new);
            c.setTypeContact(TypeContact.WHATSAPP);
            c.setExternalId(canalId);
            c.setUserApp(u);
            contactRepository.save(c);

            log.info("WhatsApp {} lié au compte {}", canalId, u.getId());
            send(canalId, "✅ Merci ! Votre WhatsApp est maintenant lié à votre compte Paikady.\n"
                    + "Vous pouvez me poser vos questions ici.");
        } catch (Exception ex) {
            log.error("Échec de la liaison WhatsApp {}", canalId, ex);
            send(canalId, "Désolé, la liaison a échoué. Réessayez dans un instant.");
        }
    }

    private List<UserApp> findCandidates(String canalId) {
        String local = toLocalNumber(canalId);
        if (local == null) return List.of();
        String national = local.substring(1); // 389324324
        List<String> variants = new ArrayList<>();
        variants.add(local);                   // 0389324324
        variants.add("261" + national);        // 261389324324
        variants.add("+261" + national);       // +261389324324
        return userAppRepository.findByContactIn(variants);
    }

    /** "261389324324@s.whatsapp.net", "+261 38 93 243 24" ou "0389324324" -> "0389324324". */
    private String toLocalNumber(String raw) {
        if (raw == null) return null;
        String digits = raw.split("@")[0].replaceAll("[^0-9]", "");
        if (digits.startsWith("261") && digits.length() == 12) {
            return "0" + digits.substring(3);
        }
        if (digits.startsWith("0") && digits.length() == 10) {
            return digits;
        }
        return null; // format inconnu (ex. identifiant LID) : pas de liaison automatique
    }

    private String maskedName(UserApp u) {
        String first = u.getFirstName() == null ? "" : u.getFirstName().trim();
        String last = u.getLastName() == null ? "" : u.getLastName().trim();
        String initial = last.isEmpty() ? "" : " " + last.substring(0, 1).toUpperCase() + ".";
        return (first + initial).trim();
    }

    private String confirmationQuestion(String displayName) {
        return "👋 Bonjour ! Je ne reconnais pas encore ce WhatsApp, mais ce numéro est associé "
                + "à un compte Paikady au nom de *" + displayName + "*.\n\n"
                + "Est-ce bien vous ? Répondez OUI pour lier ce WhatsApp à ce compte, ou NON.";
    }

    // ---------- Conversation normale ----------

    private String handle(String userId, String text) {
        String normalized = normalizeAnswer(text);

        var draft = pending.latestFor(userId);
        if (draft.isPresent() && OUI.contains(normalized)) {
            return assistant.confirm(userId, draft.get().id()).reply();
        }
        if (draft.isPresent() && NON.contains(normalized)) {
            assistant.cancel(userId, draft.get().id());
            return "D'accord, action annulée.";
        }

        ChatResponse r = assistant.chat(userId, "whatsapp", text);
        String reply = r.reply();
        if (r.pendingAction() != null) {
            reply += "\n\n➡️ " + r.pendingAction().description()
                    + "\nRépondez OUI pour confirmer ou NON pour annuler.";
        }
        return reply;
    }

    private String normalizeAnswer(String text) {
        return text.toLowerCase().replaceAll("[.!\\s]+$", "");
    }

    // ---------- Aide aux numéros non liés ----------

    private String helpNotLinked() {
        return "👋 Bonjour ! Je suis l'assistant de Paikady, mais je ne reconnais pas encore ce numéro.\n\n"
                + "Pour lier votre WhatsApp à votre compte :\n"
                + "1. Connectez-vous à Paikady : " + appUrl + "\n"
                + "2. Dans l'application, demandez un code de liaison WhatsApp.\n"
                + "3. Envoyez ce code ici, dans ce chat.\n\n"
                + "Le code est valable peu de temps. Une fois lié, vous pourrez me poser vos questions "
                + "et demander des actions directement ici.";
    }

    private String helpInactive() {
        return "Ce compte n'est pas actif pour le moment. "
                + "Contactez l'administrateur de l'application.";
    }

    /** Envoie le message d'aide au plus une fois par période et par numéro. */
    private void sendHelpOnce(String canalExternalId, String message) {
        Instant now = Instant.now();
        Instant previous = lastHelp.get(canalExternalId);
        if (previous != null
                && Duration.between(previous, now).toHours() < helpCooldownHours) {
            log.debug("Aide déjà envoyée récemment à {}, message ignoré", canalExternalId);
            return;
        }
        if (lastHelp.size() > MAX_TRACKED) {
            lastHelp.entrySet().removeIf(en ->
                    Duration.between(en.getValue(), now).toHours() >= helpCooldownHours);
        }
        lastHelp.put(canalExternalId, now);
        send(canalExternalId, message);
        log.info("Message d'aide à la liaison envoyé à {}", canalExternalId);
    }

    private void send(String canalExternalId, String text) {
        String body = text.length() > MAX_LEN ? text.substring(0, MAX_LEN) + "…" : text;
        messagingServices.stream()
                .filter(s -> s.getType() == TypeCanal.WHATSAPP)
                .findFirst()
                .ifPresent(s -> s.sendMessage(canalExternalId,
                        SendMessageRequestDto.builder().text(body).build()));
    }
}