package com.kinga.tasksservice.web;


import com.kinga.tasksservice.dto.UserDetailsDeto;
import com.kinga.tasksservice.entity.UserApp;
import com.kinga.tasksservice.service.UserService;
import com.kinga.utils.KingaUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.util.List;


@Controller
public class GQUserController {
    private static final Logger logger = LoggerFactory.getLogger(GQUserController.class);
    @Autowired
    UserService userService;

    @QueryMapping
    public UserApp getUser(@Argument String username){
        return userService.findByUsernamOrContactOrCinOrEmail(username);
    }
    @MutationMapping
    public UserApp saveUser(@Argument UserApp userApp){
       return userService.save(userApp);
    }
    @QueryMapping
    public List<UserApp> allUsers(){
       return userService.findAll();
    }
    @GetMapping({"/", "/public/**", "/private/**"})
    public String publicRedirection(){
        logger.info("loading page frontend  ");
        return "/index.html";
    }
    @PostMapping("/api/upload/photo")
    public ResponseEntity<String> uploadFile(@RequestPart("file") MultipartFile file, @RequestParam String userId) {
        return userService.addPhoto(file, userId);
    }
}
