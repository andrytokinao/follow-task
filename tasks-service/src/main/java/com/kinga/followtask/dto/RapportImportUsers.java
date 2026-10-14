package com.kinga.followtask.dto;

import java.util.List;

/**
 * Compte rendu d'un import d'utilisateurs par tableur.
 *
 * <p>Un import en masse n'est jamais « réussi » ou « échoué » en bloc : sur
 * deux cents lignes, trois auront un numéro mal saisi et une adresse de photo
 * morte. Le rapport rend donc le détail ligne par ligne, avec le numéro de
 * ligne du fichier, pour que l'utilisateur corrige son tableur et relance
 * l'import sur les seules lignes rejetées.</p>
 *
 * @param total    lignes de données lues (en-tête exclu)
 * @param crees    utilisateurs effectivement enregistrés
 * @param rejetes  lignes refusées, aucun utilisateur créé pour elles
 * @param ignores  personnes écartées parce qu'elles ont déjà un compte (import
 *                 depuis un annuaire) ; toujours 0 pour un tableur
 * @param lignes   détail, dans l'ordre du fichier
 */
public record RapportImportUsers(int total, int crees, int rejetes, int ignores, List<LigneImport> lignes) {

    /** Import par tableur : rien n'y est ignoré. */
    public RapportImportUsers(int total, int crees, int rejetes, List<LigneImport> lignes) {
        this(total, crees, rejetes, 0, lignes);
    }

    /** Sort d'une ligne du tableur. */
    public enum Statut {
        /** Utilisateur créé, photo comprise s'il y en avait une. */
        CREE,
        /** Utilisateur créé, mais sa photo n'a pas pu être récupérée. */
        CREE_SANS_PHOTO,
        /** Rien n'a été créé : voir le message. */
        REJETE,
        /** Déjà présent, ou homonyme non confirmé : volontairement pas créé. */
        IGNORE
    }

    /**
     * @param ligne    numéro de ligne dans le fichier, en-tête compris (la
     *                 première ligne de données est donc la 2)
     * @param username identifiant retenu, ou ce qui a pu en être lu
     * @param statut   sort de la ligne
     * @param message  motif du rejet, ou avertissement sur la photo ; vide sinon
     */
    public record LigneImport(int ligne, String username, Statut statut, String message) {
    }
}
