package com.kinga.followtask.assistant.service;

import com.kinga.followtask.assistant.dto.PendingAction;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PendingActionService {

    private record Entry(String userId, PendingAction action, Runnable exec, Instant expires) {}

    private final Map<String, Entry> store = new ConcurrentHashMap<>();

    public PendingAction store(String userId, String description, Runnable exec) {
        PendingAction a = new PendingAction(UUID.randomUUID().toString(), description);
        store.put(a.id(), new Entry(userId, a, exec, Instant.now().plus(Duration.ofMinutes(10))));
        return a;
    }

    /** Dernier brouillon de l'utilisateur, pour l'afficher dans la réponse. */
    public Optional<PendingAction> latestFor(String userId) {
        return store.values().stream()
                .filter(e -> e.userId().equals(userId) && e.expires().isAfter(Instant.now()))
                .max(Comparator.comparing(Entry::expires))
                .map(Entry::action);
    }

    public void execute(String userId, String actionId) {
        Entry e = store.remove(actionId);
        if (e == null || !e.userId().equals(userId) || e.expires().isBefore(Instant.now()))
            throw new IllegalStateException("Action introuvable ou expirée");
        e.exec().run();
    }

    public void cancel(String userId, String actionId) {
        Entry e = store.get(actionId);
        if (e != null && e.userId().equals(userId)) store.remove(actionId);
    }
}