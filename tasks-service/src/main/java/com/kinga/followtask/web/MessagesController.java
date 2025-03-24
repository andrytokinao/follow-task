package com.kinga.followtask.web;

import com.kinga.followtask.entity.Canall;
import com.kinga.followtask.entity.MessageApp;
import com.kinga.followtask.service.MessagesService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class MessagesController {
    private final MessagesService messagesService;
    @MutationMapping
    public Canall createCanal(@Argument Canall canall) {
        return messagesService.createCanal(canall);
    }
    @QueryMapping
    public List<Canall> getCanalByProject(@Argument Long projectId, @Argument List<String> userIds) {
        return messagesService.getCanalByProject(projectId, userIds);
    }
    @MutationMapping
    public MessageApp sendMessage(@Argument MessageApp newMessage){
        return messagesService.sendMessage(newMessage);
    }

    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public String handleException(Throwable exception) {
        return exception.getMessage();
    }
}
