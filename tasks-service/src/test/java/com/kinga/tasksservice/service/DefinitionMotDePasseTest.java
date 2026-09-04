package com.kinga.tasksservice.service;

import com.kinga.followtask.config.ConfigSystem;
import com.kinga.followtask.dto.SetPasswordRequest;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.UserRepository;
import com.kinga.followtask.service.UserService;
import com.kinga.followtask.web.AutController;
import com.kinga.utils.KingaUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Définition du mot de passe d'un compte par un administrateur.
 *
 * <p>Une opération de sécurité se vérifie sur ce qu'elle écrit en base, pas sur
 * ce que l'écran affiche : le mot de passe doit y être haché, la copie
 * réversible effacée, et un mot de passe trop court refusé avant toute
 * écriture.</p>
 */
class DefinitionMotDePasseTest {

    private static final String IDENTIFIANT = "u1";

    private final UserRepository userRepository = mock(UserRepository.class);
    private UserService userService;
    private UserApp compte;

    @BeforeEach
    void preparer() {
        userService = new UserService(mock(ConfigSystem.class));
        // Le dépôt est injecté par champ dans le service : le test le pose de
        // la même façon, faute de constructeur qui le prenne.
        ReflectionTestUtils.setField(userService, "userRepository", userRepository);

        compte = new UserApp();
        compte.setId(IDENTIFIANT);
        compte.setUsername("jrakoto");
        compte.setPassword(KingaUtils.encodePassword("ancien-mot-de-passe"));
        compte.setPass(KingaUtils.encodeText("ancien-mot-de-passe"));
        compte.setCode(1234);

        when(userRepository.findById(IDENTIFIANT)).thenReturn(Optional.of(compte));
    }

    @Test
    void leMotDePasseEstEnregistreHache() {
        userService.definirMotDePasse(IDENTIFIANT, "nouveau-secret", "admin");

        UserApp enregistre = capturer();
        assertThat(enregistre.getPassword()).isNotEqualTo("nouveau-secret");
        assertThat(KingaUtils.matchesPassword("nouveau-secret", enregistre.getPassword())).isTrue();
    }

    /**
     * Le champ {@code pass} garde une forme réversible du mot de passe. Rien ne
     * le lit dans l'application : le laisser en base offrirait de quoi
     * retrouver un mot de passe en clair, sans contrepartie.
     */
    @Test
    void laCopieReversibleEstEffacee() {
        userService.definirMotDePasse(IDENTIFIANT, "nouveau-secret", "admin");

        assertThat(capturer().getPass()).isNull();
    }

    /**
     * Un code de réinitialisation resté en attente permettrait encore de
     * changer ce mot de passe par la voie « mot de passe oublié ».
     */
    @Test
    void leCodeDeReinitialisationEstAnnule() {
        userService.definirMotDePasse(IDENTIFIANT, "nouveau-secret", "admin");

        assertThat(capturer().getCode()).isNull();
    }

    @Test
    void unMotDePasseTropCourtEstRefuseAvantToutEcriture() {
        assertThatThrownBy(() -> userService.definirMotDePasse(IDENTIFIANT, "abc", "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("6");

        verify(userRepository, never()).save(any());
    }

    /**
     * La route est réservée à l'administrateur du système.
     *
     * <p>Vérification par introspection, faute de pouvoir monter ici le
     * contexte de sécurité complet. Elle ne prouve pas que Spring applique la
     * règle — elle prouve que la règle est toujours écrite, et c'est ce qui se
     * perd silencieusement : une annotation retirée d'un geste ouvrirait la
     * prise de contrôle de n'importe quel compte à tout utilisateur
     * authentifié.</p>
     */
    @Test
    void laRouteEstReserveeALAdministrateurDuSysteme() throws Exception {
        PreAuthorize autorisation = AutController.class
                .getMethod("setPassword", String.class, SetPasswordRequest.class)
                .getAnnotation(PreAuthorize.class);

        assertThat(autorisation).isNotNull();
        assertThat(autorisation.value()).isEqualTo("hasAuthority('SYSTEM_ADMIN')");
    }

    @Test
    void unCompteInconnuEstSignale() {
        when(userRepository.findById("absent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.definirMotDePasse("absent", "nouveau-secret", "admin"))
                .isInstanceOf(IllegalStateException.class);
    }

    private UserApp capturer() {
        ArgumentCaptor<UserApp> capture = ArgumentCaptor.forClass(UserApp.class);
        verify(userRepository).save(capture.capture());
        return capture.getValue();
    }
}
