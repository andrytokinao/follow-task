package com.kinga.followtask.service.phase;

import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.Phase;

import java.util.Optional;

/**
 * Dit dans quelle phase se trouve un projet.
 *
 * <p>Interface : la regle actuelle lit le statut du projet
 * ({@link PhaseCouranteParStatut}). Une autre installation pourrait la lire
 * sur un champ personnalise ou sur les dates du planning sans que les
 * appelants ne changent.</p>
 */
public interface ResolveurPhaseCourante {

    /**
     * Phase en cours du projet auquel appartient la tache.
     *
     * @param tache le projet lui-meme (demande racine) ou l'une de ses taches,
     *              a n'importe quel niveau : c'est la racine qui compte
     * @return vide si le projet n'est dans aucune phase (statut « Suspendu »,
     * « Cloture »... non lie a une phase)
     */
    Optional<Phase> phaseCourante(Issue tache);
}
