package com.kinga.followtask.dto.rapport;

import java.util.List;

/**
 * Tout ce qu'un espace de travail offre à la sélection lors de la création d'un
 * rapport.
 *
 * <p>Servi en un seul appel : le formulaire de création montre les trois listes
 * ensemble, les charger séparément le ferait apparaître par morceaux. Les
 * entrées sont volontairement légères — de quoi choisir, pas de quoi rendre un
 * rapport, qui n'est calculé qu'une fois la sélection faite.</p>
 */
public record OptionsRapportDTO(String departement,
                                String prefixeDepartement,
                                List<OptionProjetDTO> projets,
                                List<OptionPersonneDTO> personnes,
                                List<OptionEquipeDTO> equipes) {
}
