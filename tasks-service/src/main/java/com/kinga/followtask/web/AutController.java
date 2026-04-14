package com.kinga.followtask.web;

import com.kinga.followtask.dto.Accessibility;
import com.kinga.followtask.dto.ChangePasswordRequest;
import com.kinga.followtask.dto.UserDetailsDeto;
import com.kinga.followtask.repository.UserRepository;
import com.kinga.followtask.service.AuthorizationService;
import com.kinga.followtask.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;


@RestController
@RequiredArgsConstructor
public class    AutController {
    private static final Logger logger= LoggerFactory.getLogger(AutController.class);
    private final AuthorizationService authorizationService;
    @Autowired
    UserService userService;
    @Autowired
    private UserRepository userRepository;

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
    @ResponseBody
    @GetMapping("verify-code")
    public Map codeReset(@RequestParam String phone,@RequestParam  Integer code) {
        return this.userService.verifyCode(phone,code);
    }
    @ResponseBody
    @GetMapping("reset-pasword")
    public Map resetPasword(@RequestParam String phone) {
       return this.userService.resetPasword(phone);
    }
    @ResponseBody
    @GetMapping("new-password")
    public Map newPassword(@RequestParam Integer code, @RequestParam String phone, @RequestParam String password) {
        return this.userService.newPassword(code, phone, password);
    }
    @PostMapping("api/users/{id}/change-password")
    public ResponseEntity<?> changePassword(
            @PathVariable String id,
            @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(id, request.getCurrentPassword(),
                request.getNewPassword());
        return ResponseEntity.ok().build();
    }
}
