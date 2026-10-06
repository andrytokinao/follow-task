package com.kinga.followtask.service;

import com.kinga.followtask.dto.UserDetailsDeto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private static final Logger logger = LoggerFactory.getLogger(CustomUserDetailsService.class);
    @Autowired
    private UserService userService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserDetailsDeto user = userService.findByUsername(username);
        logger.info("Loading user for username= "+username);
        if(user == null) {
            throw new UsernameNotFoundException("Utilisateur non trouvé : " + username);
        }

        // Compte desactive : `enabled = false` fait refuser la connexion par
        // Spring (DisabledException), avant meme la verification du mot de passe.
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                user.isActive(),
                true,
                true,
                true,
                getAuthorities(user.getPermissions())
        );
    }


    private Collection<? extends GrantedAuthority> getAuthorities(Set<String> permitions) {
        return permitions.stream()
                .map(permission -> new SimpleGrantedAuthority(permission))
                .collect(Collectors.toList());
    }
}
