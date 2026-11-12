package com.kinga.followtask.assistant;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

@Configuration
public class AssistantConfig {

    @Bean
    ChatMemory chatMemory() {
        return MessageWindowChatMemory.builder().maxMessages(20).build();
    }

    @Bean
    ChatClient assistantClient(ChatClient.Builder builder, ChatMemory memory) {
        return builder
                .defaultSystem(new ClassPathResource("prompt/system-prompt.st"))
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(memory).build())
                .build();
    }
}