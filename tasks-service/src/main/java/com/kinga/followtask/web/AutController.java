package com.kinga.followtask.web;

import com.kinga.followtask.dto.Accessibility;
import com.kinga.followtask.dto.ChangePasswordRequest;
import com.kinga.followtask.dto.SetPasswordRequest;
import com.kinga.followtask.dto.UserDetailsDeto;
import com.kinga.followtask.repository.UserRepository;
import com.kinga.followtask.service.AuthorizationService;
import com.kinga.followtask.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    /**
     * Définition du mot de passe d'un compte par un administrateur.
     *
     * <p>Le mot de passe actuel n'est pas demandé — un administrateur ne le
     * connaît pas — ce qui fait de cette route une prise de contrôle possible
     * sur n'importe quel compte. D'où l'autorisation exigée ici, et non
     * seulement dans l'écran d'administration : une page peut être contournée,
     * pas une route.</p>
     *
     * <p>Les droits retenus sont ceux de l'administration des comptes, dont
     * dépend déjà la page « Gestion des utilisateurs ».</p>
     */
    @PostMapping("api/users/{id}/password")
    @PreAuthorize("hasAnyAuthority('CAN_ACCESS_ALL', 'CAN_MANAGE_SECURITY', 'CAN_MANAGE_USERS')")
    public ResponseEntity<?> setPassword(
            @PathVariable String id,
            @RequestBody SetPasswordRequest request
    ) {
        userService.definirMotDePasse(id, request.getNewPassword(), auteur());
        return ResponseEntity.ok().build();
    }

    /** Identifiant de l'utilisateur connecté, pour la trace des opérations sensibles. */
    private String auteur() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication == null ? "inconnu" : authentication.getName();
    }

    /**
     * Saisie refusée — mot de passe trop court, par exemple. Le message du
     * service dit quoi corriger, l'écran le reprend tel quel plutôt que
     * d'afficher une erreur générique.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleSaisieInvalide(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    /** Compte introuvable. */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIntrouvable(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }
}
