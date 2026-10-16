package com.kinga.followtask.dto.situation;

/** Ou en est-on : les projets en cours du departement, en quatre chiffres. */
public record ChiffresProjetsDTO(int enCours, int avancementMoyen, int tachesEnRetard, int tachesBloquees) {
}
