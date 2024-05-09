package com.kinga.tasksservice.web;

import com.kinga.tasksservice.dto.Accessibility;
import com.kinga.tasksservice.dto.UserDetailsDeto;
import com.kinga.tasksservice.service.AuthorizationService;
import com.kinga.tasksservice.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;


@RestController
@RequiredArgsConstructor
public class AutController {
    private static final Logger logger= LoggerFactory.getLogger(AutController.class);
    private final AuthorizationService authorizationService;
    @Autowired
    UserService userService;
    @GetMapping( "/api/profile")
    @ResponseBody
    public UserDetailsDeto getConnected(HttpServletRequest request){
        String authToken = request.getHeader("Authorization");
        logger.info("authToken ="+authToken);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if(authentication.getPrincipal() instanceof  UserDetails) {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            return userService.findByUsername(userDetails.getUsername());
        }
        return null;
    }
    @GetMapping( "/api/accessibility")
    @ResponseBody
    public Accessibility getAccessibility(HttpServletRequest request){
        String authToken = request.getHeader("Authorization");
        logger.info("authToken ="+authToken);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if(authentication.getPrincipal() instanceof  UserDetails) {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            return authorizationService.getAccessibility(userService.findByUsername(userDetails.getUsername()));
        }
        return null;

    }
    @GetMapping( "/auth-failed")
    @ResponseBody
    public Map<String,String> failedAutentication(){
        Map<String,String> map = new HashMap<>();
        map.put("result","failed");
        return map;
    }
    @GetMapping( "/auth-success")
    @ResponseBody
    public Map<String,String>  authenticationSuccess(){
        Map<String,String> map = new HashMap<>();
        map.put("result","success");
        return map;
    }
}
