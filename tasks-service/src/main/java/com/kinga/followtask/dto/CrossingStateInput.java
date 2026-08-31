package com.kinga.followtask.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entree d'une transition de workflow : les statuts sont references par leur
 * identifiant, la conversion en entite est faite par le service.
 */
@Data
@NoArgsConstructor
public class CrossingStateInput {
    private Long id;
    private String name;
    private String description;
    private Long from;
    private Long to;
}
