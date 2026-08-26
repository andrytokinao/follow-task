package com.kinga.followtask.config;

import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.UserAppRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserProvider {

    private final UserAppRepository userAppRepository;

    public CurrentUserProvider(UserAppRepository userAppRepository) {
        this.userAppRepository = userAppRepository;
    }

    public UserApp getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Aucun utilisateur authentifié");
        }
        Object principal = auth.getPrincipal();

        if (principal instanceof User userApp) {
            String username = userApp.getUsername();
            return userAppRepository.findUserAppByUsername(username);
        }



        throw new IllegalStateException("Type de principal inattendu : " + principal.getClass());
    }
}