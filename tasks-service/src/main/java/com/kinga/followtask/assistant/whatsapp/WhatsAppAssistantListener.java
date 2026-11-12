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
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class WhatsAppAssistantListener {

    private static final Set<String> OUI = Set.of("oui", "eny", "ok", "confirmer", "yes");
    private static final Set<String> NON = Set.of("non", "tsia", "annuler", "no");
    private static final int MAX_LEN = 3500;

    private final ContactRepository contactRepository;
    private final AssistantService assistant;
    private final PendingActionService pending;
    private final java.util.List<MessagingService> messagingServices;

    @Async
    @EventListener
    public void onDirectMessage(DirectMessageReceivedEvent e) {
        if (e.text() == null || e.text().isBlank()) return;

        // 1. Qui est-ce ? Contact lié à un compte, sinon on reste silencieux
        Optional<UserApp> user = contactRepository
                .findByTypeContactAndExternalId(TypeContact.WHATSAPP, e.canalExternalId())
                .map(Contact::getUserApp);

        if (user.isEmpty() || !user.get().estActif()) {
            log.debug("Message WhatsApp ignoré : contact non lié ou compte inactif ({})", e.canalExternalId());
            return;
        }
        String userId = user.get().getId();

        try {
            String reply = handle(userId, e.text().trim());
            send(e.canalExternalId(), reply);
        } catch (Exception ex) {
            log.error("Assistant WhatsApp : échec pour user={}", userId, ex);
            send(e.canalExternalId(), "Désolé, une erreur est survenue. Réessayez dans un instant.");
        }
    }

    private String handle(String userId, String text) {
        String normalized = text.toLowerCase().replaceAll("[.!\\s]+$", "");

        // 2. Réponse à un brouillon en attente (OUI / NON)
        var draft = pending.latestFor(userId);
        if (draft.isPresent() && OUI.contains(normalized)) {
            return assistant.confirm(userId, draft.get().id()).reply();
        }
        if (draft.isPresent() && NON.contains(normalized)) {
            assistant.cancel(userId, draft.get().id());
            return "D'accord, action annulée.";
        }

        // 3. Conversation normale : mémoire propre à cet utilisateur sur WhatsApp
        ChatResponse r = assistant.chat(userId, "whatsapp", text);
        String reply = r.reply();
        if (r.pendingAction() != null) {
            reply += "\n\n➡️ " + r.pendingAction().description()
                    + "\nRépondez OUI pour confirmer ou NON pour annuler.";
        }
        return reply;
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