package com.kinga.followtask.entity.enumapp;

/**
 * Sens d'un statut de workflow pour l'avancement automatique (DT-007).
 *
 * <p>Les statuts sont propres a chaque flux (« Ouvert », « En Cours »,
 * « A vérifier »...) : leur libelle ne dit rien de fiable. Chaque statut peut
 * donc etre rattache a une etape, et c'est l'etape que lit la synchronisation
 * planning -> statut.</p>
 *
 * <p>Le rang ordonne les etapes : la synchronisation ne fait jamais reculer
 * une tache, et ne touche qu'aux taches encore a faire ou en cours. Bloquer,
 * valider et terminer restent des decisions humaines a defaire.</p>
 */
public enum EtapeAvancement {
    A_FAIRE(0),
    EN_COURS(1),
    BLOQUE(2),
    A_VALIDER(3),
    TERMINE(4);

    private final int rang;

    EtapeAvancement(int rang) {
        this.rang = rang;
    }

    /**
     * La synchronisation peut-elle faire passer une tache de cette etape a la
     * cible ? Seulement en avancant, et seulement depuis A_FAIRE ou EN_COURS.
     */
    public boolean peutAvancerAutomatiquementVers(EtapeAvancement cible) {
        return (this == A_FAIRE || this == EN_COURS) && cible != null && cible.rang > this.rang;
    }

    /** La tache n'attend plus de travail de l'executant. */
    public boolean estAchevee() {
        return this == A_VALIDER || this == TERMINE;
    }
}
