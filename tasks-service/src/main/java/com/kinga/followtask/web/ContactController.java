package com.kinga.followtask.web;

import com.kinga.followtask.dto.UserDetailsDeto;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.TypeContact;
import com.kinga.followtask.repository.UserAppRepository;
import com.kinga.followtask.service.UserService;
import com.kinga.followtask.service.contactuser.ContactLinkService;
import com.kinga.followtask.service.contactuser.LinkCodeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactLinkService contactLinkService;
    private final UserService userService;

    @PostMapping("/link-code")
    public ResponseEntity<LinkCodeResponse> generateLinkCode(
            Authentication authentication,
            @RequestParam(defaultValue = "WHATSAPP") TypeContact type) {

        UserDetailsDeto user = userService.findByUsername(authentication.getName());
        if (user == null) new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Utilisateur introuvable");
        return ResponseEntity.ok(contactLinkService.generate(user.getId(), type));
    }

}