package com.kinga.followtask.web;

import com.kinga.followtask.dto.UserDetailsDeto;
import com.kinga.followtask.entity.Canall;
import com.kinga.followtask.service.ChatService;
import com.kinga.followtask.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Controller("/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;
    private final UserService userService;


    @GetMapping("get-chanel")
    public Canall  getCanall(List<String> users) {
        return chatService.getCannal(users);
    }
    @GetMapping("get-chanels")
    public List<Canall>  getCanall(Long projectId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if(authentication.getPrincipal() instanceof UserDetails) {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            UserDetailsDeto userApp = userService.findByUsername(userDetails.getUsername());
            return chatService.listCanall(projectId,userApp.getId());
        }
        return null;
    }
    @GetMapping("my-channels")
    public List<Canall>  myChannels(@RequestParam Long projectId) {
       String me = "";
        return chatService.myChannels(projectId,me);
    }
}
