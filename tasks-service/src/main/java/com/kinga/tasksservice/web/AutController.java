package com.kinga.tasksservice.web;

import com.kinga.tasksservice.dto.UserDetailsDeto;
import com.kinga.tasksservice.entity.UserApp;
import com.kinga.tasksservice.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;


@RestController
public class AutController {
    private static final Logger logger= LoggerFactory.getLogger(AutController.class);
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
    @GetMapping( "/auth-failed")
    @ResponseBody
    public String failedAutentication(){
        return "failed";
    }
    @GetMapping( "/auth-success")
    @ResponseBody
    public String authenticationSuccess(){
        return "success";
    }
}
