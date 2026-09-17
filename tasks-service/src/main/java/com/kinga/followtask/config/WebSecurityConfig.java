package com.kinga.followtask.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kinga.followtask.service.CustomUserDetailsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.ObjectPostProcessor;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer;
import org.springframework.security.config.annotation.web.configurers.DefaultLoginPageConfigurer;
import org.springframework.security.config.core.GrantedAuthorityDefaults;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.ui.DefaultLoginPageGeneratingFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(
        prePostEnabled = true,
        securedEnabled = true,
        jsr250Enabled = true)
public class WebSecurityConfig {
    private static final Logger logger = LoggerFactory.getLogger(WebSecurityConfig.class);

    /**
     * URL de la page de connexion generee par Spring Security et de soumission
     * du formulaire, alignee sur le prefixe "/api" du reste des endpoints.
     * "/login" est une route Angular : laissee a Spring, un rechargement ou un
     * lien direct affichait sa page generee au lieu de celle du front. Le front
     * detecte toujours une session expiree au contenu de la page generee.
     */
    static final String LOGIN_PROCESSING_URL = "/api/login";

    @Autowired
    private CustomUserDetailsService userDetailsService;
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // formLogin() place la page generee sur "/login" et ne permet de la
        // deplacer qu'en la declarant personnalisee, ce qui la desactive. On la
        // conserve en corrigeant ses URL une fois initialisee par formLogin().
        http.getConfigurer(DefaultLoginPageConfigurer.class)
                .withObjectPostProcessor(new ObjectPostProcessor<DefaultLoginPageGeneratingFilter>() {
                    @Override
                    public <O extends DefaultLoginPageGeneratingFilter> O postProcess(O filter) {
                        filter.setLoginPageUrl(LOGIN_PROCESSING_URL);
                        filter.setFailureUrl(LOGIN_PROCESSING_URL + "?error");
                        filter.setLogoutSuccessUrl(LOGIN_PROCESSING_URL + "?logout");
                        return filter;
                    }
                });
        http
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers
                        .frameOptions(frameOptions -> frameOptions.sameOrigin())
                )
                .authorizeHttpRequests((requests) -> requests
                        .requestMatchers(new AntPathRequestMatcher("/ws/**")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/graphql")).authenticated()
                        .requestMatchers(new AntPathRequestMatcher("/api/init-user")).permitAll()
                        // UpdateController est monté sur "/api/updates" (pluriel). La règle
                        // au singulier ne correspondait à aucune route : la vérification de
                        // version retombait sur "/api/**" et exigeait donc une session.
                        .requestMatchers(new AntPathRequestMatcher("/api/updates/**")).permitAll()
                        // L'authentification est passee sous "/api/login" : sans regle
                        // explicite, elle tomberait dans le "/api/**" authentifie ci-dessous
                        // et il faudrait etre connecte pour pouvoir se connecter. Le
                        // permitAll() de formLogin() n'y suffit pas : il est ajoute en fin
                        // de liste, donc apres la regle qui l'emporte.
                        .requestMatchers(new AntPathRequestMatcher(LOGIN_PROCESSING_URL)).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/api/upload")).authenticated()
                        .requestMatchers(new AntPathRequestMatcher("/api/messaging/**")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/update/**")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/api/**")).authenticated()
                        .requestMatchers(new AntPathRequestMatcher("/wsocket/**")).authenticated()
                        .requestMatchers(new AntPathRequestMatcher("/topic/**")).authenticated()
                        .requestMatchers(new AntPathRequestMatcher("/")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/verify-code")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/reset-pasword")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/new-password")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("//**")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/working/**")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/**", HttpMethod.OPTIONS.name())).permitAll()
                        .anyRequest().permitAll())
                .formLogin(form -> form
                        .loginProcessingUrl(LOGIN_PROCESSING_URL)
                        .permitAll()
                        .failureHandler(failureHandler())
                        .successHandler(successHandler())
                )
                // Le point d'entree par defaut de formLogin() redirige vers "/login",
                // qui sert desormais l'index Angular : le front ne reconnaitrait plus
                // la page de connexion dans la reponse et raterait l'expiration.
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(new LoginUrlAuthenticationEntryPoint(LOGIN_PROCESSING_URL))
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setContentType("application/json;charset=UTF-8");
                            response.setStatus(200);
                            Map<String, Object> map = new HashMap<>();
                            map.put("result", "success");
                            map.put("message", "Déconnexion réussie");
                            new ObjectMapper().writeValue(response.getWriter(), map);
                        })
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                );

        return http.build();
    }

    @Autowired
    public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
        logger.info("Loading userDetailsService");
        auth.userDetailsService(userDetailsService);
    }

    @Bean
    public GrantedAuthorityDefaults grantedAuthorityDefaults() {
        return new GrantedAuthorityDefaults("");
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        logger.info("Loading DaoAuthenticationProvider");
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        logger.info("Loading AuthenticationManager");
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public AuthenticationSuccessHandler successHandler() {
        return (request, response, authentication) -> {
            response.setContentType("application/json;charset=UTF-8");
            Map<String, String> map = new HashMap<>();
            map.put("result", "success");
            map.put("username", authentication.getName());
            new ObjectMapper().writeValue(response.getWriter(), map);
        };
    }

    @Bean
    public AuthenticationFailureHandler failureHandler() {
        return (request, response, exception) -> {
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(401); // Unauthorized
            Map<String, String> map = new HashMap<>();
            map.put("result", "error");
            map.put("message", exception.getMessage());
            new ObjectMapper().writeValue(response.getWriter(), map);
        };
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
