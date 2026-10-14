package com.kinga.followtask.dto;

import java.util.List;

/**
 * Import de fiches d'annuaire.
 *
 * @param references  adresses ou identifiants des fiches, une par personne
 * @param confirmees  références dont l'administrateur accepte la création
 *                    malgré un homonyme
 * @param motDePasse  mot de passe donné à tous les comptes créés
 */
public record DemandeImportAnnuaire(List<String> references,
                                    List<String> confirmees,
                                    String motDePasse) {
}
