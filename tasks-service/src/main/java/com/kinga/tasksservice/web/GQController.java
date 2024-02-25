package com.kinga.tasksservice.web;


import com.kinga.tasksservice.entity.UserApp;
import com.kinga.tasksservice.service.UserService;
import org.apache.catalina.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.ArrayList;
import java.util.List;


@Controller
public class GQController {
    private static final Logger logger = LoggerFactory.getLogger(GQController.class);
    @Autowired
    UserService userService;



    @QueryMapping
    public UserApp getUser(@Argument String username){
        return userService.findByUsernamOrContactOrCinOrEmail(username);
    }
    @MutationMapping
    public List<UserApp> saveUser(@Argument UserApp poste){
        return new ArrayList<>();

    }
    @GetMapping({"/", "/compte/**", "/etudiants/**","/comptable/**","/admin/**"})
    public String publicRedirection(){
        logger.info("loading page frontend  ");
        return "/index.html";
    }




}
