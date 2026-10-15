package com.kinga.followtask.dto;

import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.Phase;

/**
 * Une entree de la liste des types a la creation d'une sous-tache : un type,
 * dans une phase. Un type utilise dans plusieurs phases donne une entree par
 * phase ; choisir l'entree fixe a la fois le type et la phase de la tache.
 *
 * @param issueType type de la sous-tache
 * @param phase     phase dans laquelle la tache sera classee ; null si le type n'en a aucune
 * @param proposee  true si l'entree est affichee d'office : phase courante du
 *                  projet, type sans phase, ou projet sans phase courante. Les
 *                  autres ne s'affichent qu'a la demande (travail en avance,
 *                  correction d'une phase passee).
 */
public record ChoixTypeSousTache(IssueType issueType, Phase phase, boolean proposee) {
}
