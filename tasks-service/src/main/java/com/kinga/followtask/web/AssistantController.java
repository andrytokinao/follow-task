package com.kinga.followtask.web;

import com.kinga.followtask.assistant.service.AssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assistant")
@RequiredArgsConstructor
public class AssistantController {

    private final AssistantService assistant;
/**
    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody ChatRequest req, Authentication auth) {
        // L'identité vient du JWT, jamais du corps de la requête
        return assistant.chat(auth.getName(), req.conversationId(), req.message());
    }

    @PostMapping("/confirm/{actionId}")
    public ChatResponse confirm(@PathVariable String actionId, Authentication auth) {
        return assistant.confirm(auth.getName(), actionId);
    }

    @DeleteMapping("/cancel/{actionId}")
    public void cancel(@PathVariable String actionId, Authentication auth) {
        assistant.cancel(auth.getName(), actionId);
    }
    */
}