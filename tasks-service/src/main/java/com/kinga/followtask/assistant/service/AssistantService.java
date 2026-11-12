package com.kinga.followtask.assistant.service;

import com.kinga.followtask.assistant.dto.ChatResponse;
import com.kinga.followtask.assistant.tools.DocumentTools;
import com.kinga.followtask.assistant.tools.ProjectTools;
import com.kinga.followtask.assistant.tools.TaskTools;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AssistantService {

    private final ChatClient client;
    private final TaskTools taskTools;
    private final ProjectTools projectTools;
    private final DocumentTools documentTools;
    private final PendingActionService pending;

    public ChatResponse chat(String userId, String conversationId, String message) {
        String reply = client.prompt()
                .user(message)
                .tools(taskTools, projectTools, documentTools)
                .toolContext(Map.of("userId", userId))   // identité transmise aux outils
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, userId + ":" + conversationId))
                .call()
                .content();

        return new ChatResponse(reply, pending.latestFor(userId).orElse(null));
    }

    public ChatResponse confirm(String userId, String actionId) {
        pending.execute(userId, actionId);
        return new ChatResponse("C'est fait ✅", null);
    }

    public void cancel(String userId, String actionId) {
        pending.cancel(userId, actionId);
    }
}