package com.kinga.tasksservice.service;

import com.kinga.followtask.entity.Outil;
import com.kinga.followtask.service.outil.ValidationOutil;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Icone d'un outil (DT-019) : facultative, et seulement des classes Font
 * Awesome, la valeur finissant dans un attribut class.
 */
class IconeOutilTest {

    private final ValidationOutil validation = new ValidationOutil();

    @Test
    void lesClassesFontAwesomePassent() {
        assertThat(validation.icone("fab fa-windows", Outil.ICONE_MAX)).isEqualTo("fab fa-windows");
        assertThat(validation.icone("  fas fa-file-pdf ", Outil.ICONE_MAX)).isEqualTo("fas fa-file-pdf");
        assertThat(validation.icone("fa-solid fa-gear fa-spin", Outil.ICONE_MAX)).isEqualTo("fa-solid fa-gear fa-spin");
    }

    @Test
    void videVeutDireLIconeDuType() {
        assertThat(validation.icone(null, Outil.ICONE_MAX)).isNull();
        assertThat(validation.icone("   ", Outil.ICONE_MAX)).isNull();
    }

    @Test
    void lerestEstRefuse() {
        assertThatThrownBy(() -> validation.icone("fas fa-x\" onclick=\"alert(1)", Outil.ICONE_MAX))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> validation.icone("btn btn-danger", Outil.ICONE_MAX))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> validation.icone("fas", Outil.ICONE_MAX))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
