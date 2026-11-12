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
import com.kinga.followtask.service.messaging.MessagingService;
import com.kinga.followtask.service.messaging.dto.SendMessageRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
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

    private final ContactRepository contactRepository;
    private final AssistantService assistant;
    private final PendingActionService pending;
    private final List<MessagingService> messagingServices;

    @Value("${assistant.whatsapp.help-cooldown-hours:6}")
    private long helpCooldownHours;

    @Value("${app.public-url}")
    private String appUrl;

    /** Dernier message d'aide envoyé, par numéro. En mémoire : réinitialisé au redémarrage. */
    private final Map<String, Instant> lastHelp = new ConcurrentHashMap<>();

    @Async
    @EventListener
    public void onDirectMessage(DirectMessageReceivedEvent e) {
        if (e.text() == null || e.text().isBlank()) return;

        Optional<Contact> contact = contactRepository
                .findByTypeContactAndExternalId(TypeContact.WHATSAPP, e.canalExternalId());
        Optional<UserApp> user = contact.map(Contact::getUserApp);

        // Numéro inconnu, ou connu mais non lié à un compte : guider, sans appeler l'IA
        if (user.isEmpty()) {
            sendHelpOnce(e.canalExternalId(), helpNotLinked());
            return;
        }
        // Compte désactivé : message neutre, sans détail
        if (!user.get().estActif()) {
            sendHelpOnce(e.canalExternalId(), helpInactive());
            return;
        }

        String userId = user.get().getId();
        try {
            send(e.canalExternalId(), handle(userId, e.text().trim()));
        } catch (Exception ex) {
            log.error("Assistant WhatsApp : échec pour user={}", userId, ex);
            send(e.canalExternalId(), "Désolé, une erreur est survenue. Réessayez dans un instant.");
        }
    }

    private String handle(String userId, String text) {
        String normalized = text.toLowerCase().replaceAll("[.!\\s]+$", "");

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
            // Garde-fou mémoire : purge des entrées expirées
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