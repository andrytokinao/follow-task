package com.kinga.followtask.dto;

import com.kinga.followtask.entity.Project;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Saisie d'une phase : creation, renommage ou changement de portee.
 *
 * <p>{@code commune} vaut true pour une phase partagee par tous les espaces
 * de travail ; {@code project} designe alors seulement l'espace depuis lequel
 * elle est saisie. Absent, la portee de la phase ne change pas.</p>
 */
@Data
@NoArgsConstructor
public class PhaseSaisie {
    private Long id;
    private String name;
    private Project project;
    private Boolean commune;
    /** Accepte, sans effet : l'ordre ne change que par ordonnerPhases. */
    private Integer position;
}
