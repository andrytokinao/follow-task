package com.kinga.followtask.service.situation;

import com.kinga.followtask.dto.rapport.RapportProjetDTO;
import com.kinga.followtask.dto.rapport.SyntheseProjetDTO;
import com.kinga.followtask.dto.situation.ChiffresProjetsDTO;
import com.kinga.followtask.dto.situation.ProjetATraiterDTO;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.service.DirectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * « Ou en est-on » : les projets en cours du cockpit et leurs rapports. Aucun
 * chiffre n'est recalcule ici, la situation dit la meme chose que le cockpit.
 */
@Component
@RequiredArgsConstructor
public class ChiffresDirection {

    /** Au-dela, la liste « A traiter » cesse d'etre lue d'un coup d'oeil. */
    static final int A_TRAITER_MAX = 5;

    private final DirectionService directionService;

    public record Resultat(ChiffresProjetsDTO chiffres, List<ProjetATraiterDTO> aTraiter) {
    }

    /** @param departement nom de l'espace de travail, null pour tous */
    public Resultat calculer(String departement) {
        Map<Long, RapportProjetDTO> rapports = new HashMap<>();
        List<Issue> projets = directionService.projets(departement, rapports);
        List<ProjetATraiterDTO> lignes = projets.stream()
                .map(p -> ligne(p, rapports.get(p.getId())))
                .toList();
        return new Resultat(chiffres(lignes), aTraiter(lignes));
    }

    private static ChiffresProjetsDTO chiffres(List<ProjetATraiterDTO> lignes) {
        int avancementMoyen = (int) Math.round(lignes.stream().mapToInt(ProjetATraiterDTO::avancement).average().orElse(0));
        return new ChiffresProjetsDTO(
                lignes.size(),
                avancementMoyen,
                lignes.stream().mapToInt(ProjetATraiterDTO::tachesEnRetard).sum(),
                lignes.stream().mapToInt(ProjetATraiterDTO::tachesBloquees).sum());
    }

    private static List<ProjetATraiterDTO> aTraiter(List<ProjetATraiterDTO> lignes) {
        return lignes.stream()
                .filter(l -> l.tachesEnRetard() > 0 || l.tachesBloquees() > 0)
                .sorted(Comparator.comparingInt(ProjetATraiterDTO::tachesEnRetard)
                        .thenComparingInt(ProjetATraiterDTO::tachesBloquees)
                        .reversed())
                .limit(A_TRAITER_MAX)
                .toList();
    }

    private static ProjetATraiterDTO ligne(Issue projet, RapportProjetDTO rapport) {
        SyntheseProjetDTO synthese = rapport == null ? null : rapport.synthese();
        return new ProjetATraiterDTO(
                projet.getId(),
                projet.getIssueKey(),
                projet.getSummary(),
                rapport == null ? null : rapport.departement(),
                rapport == null ? null : rapport.prefixeDepartement(),
                rapport == null ? 0 : rapport.avancementGlobal(),
                synthese == null ? 0 : synthese.nombreEnRetard(),
                synthese == null ? 0 : synthese.nombreBloquees());
    }
}
