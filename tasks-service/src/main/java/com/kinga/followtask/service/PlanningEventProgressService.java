package com.kinga.followtask.service;

import com.kinga.followtask.dto.PercentageProposalDTO;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.enumapp.ExecutionStatus;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class PlanningEventProgressService {

    /**
     * Calcule une proposition intelligente du prochain pourcentage
     * en analysant l'historique des events complétés de l'issue.
     */
    public PercentageProposalDTO proposeNextPercentage(Issue issue) {

        // 1. Récupérer tous les events de l'issue avec un % défini,
        //    triés du plus récent au plus ancien
        List<PlanningEvent> completedEvents = issue.getEvents().stream()
                .filter(e -> e.getCompletionPercentage() != null)
                .filter(e -> e.getExecutionStatus() == ExecutionStatus.COMPLETED
                        || e.getExecutionStatus() == ExecutionStatus.POSTPONED)
                .sorted(Comparator.comparing(PlanningEvent::getStart).reversed())
                .toList();

        // 2. Aucun historique → démarrage à froid
        if (completedEvents.isEmpty()) {
            return PercentageProposalDTO.builder()
                    .proposed(10)
                    .reason("Première exécution — démarrage suggéré")
                    .candidates(List.of(10, 20, 25, 30))
                    .build();
        }

        int lastPct = completedEvents.get(0).getCompletionPercentage();

        // 3. Déjà terminé
        if (lastPct >= 100) {
            return PercentageProposalDTO.builder()
                    .proposed(100)
                    .reason("Tâche déjà marquée terminée")
                    .candidates(List.of(100))
                    .build();
        }

        // 4. Calculer la progression moyenne entre les sessions
        int avgStep = computeAverageStep(completedEvents);

        // 5. Proposition principale = dernier % + pas moyen
        int proposed = Math.min(lastPct + avgStep, 100);

        // 6. Générer des candidats autour de la proposition
        List<Integer> candidates = generateCandidates(lastPct, proposed);

        // 7. Détecter un blocage répété (même % sur 2+ events)
        String reason = buildReason(completedEvents, lastPct, avgStep, proposed);

        return PercentageProposalDTO.builder()
                .proposed(proposed)
                .lastKnown(lastPct)
                .averageStep(avgStep)
                .reason(reason)
                .candidates(candidates)
                .build();
    }

    // -------------------------------------------------------
    // Calcul du pas moyen entre sessions
    // -------------------------------------------------------
    private int computeAverageStep(List<PlanningEvent> events) {
        if (events.size() == 1) {
            // Un seul event : on utilise le % lui-même comme référence
            int pct = events.get(0).getCompletionPercentage();
            return Math.max(10, pct); // au moins 10
        }

        // Calculer les deltas entre sessions consécutives (ordre croissant)
        List<PlanningEvent> ordered = new ArrayList<>(events);
        Collections.reverse(ordered); // du plus ancien au plus récent

        List<Integer> steps = new ArrayList<>();
        for (int i = 1; i < ordered.size(); i++) {
            int delta = ordered.get(i).getCompletionPercentage()
                    - ordered.get(i - 1).getCompletionPercentage();
            if (delta > 0) steps.add(delta);
        }

        if (steps.isEmpty()) return 10; // pas de progression détectée

        // Moyenne pondérée : les dernières sessions comptent plus
        double weightedSum = 0;
        double weightTotal = 0;
        for (int i = 0; i < steps.size(); i++) {
            double weight = i + 1; // poids croissant
            weightedSum += steps.get(i) * weight;
            weightTotal += weight;
        }

        int avg = (int) Math.round(weightedSum / weightTotal);
        return Math.max(5, Math.min(avg, 50)); // borné entre 5 et 50
    }

    // -------------------------------------------------------
    // Génération des candidats à proposer à l'utilisateur
    // -------------------------------------------------------
    private List<Integer> generateCandidates(int last, int proposed) {
        Set<Integer> set = new LinkedHashSet<>();
        set.add(proposed);

        // Paliers inférieurs
        int lower1 = roundToNearest5(last + (proposed - last) / 2);
        if (lower1 > last && lower1 < proposed) set.add(lower1);

        // Paliers supérieurs
        int upper1 = roundToNearest5(proposed + 10);
        int upper2 = roundToNearest5(proposed + 20);
        if (upper1 <= 100) set.add(upper1);
        if (upper2 <= 100) set.add(upper2);

        // Toujours proposer 100 si on est au-dessus de 70%
        if (last >= 70) set.add(100);

        return new ArrayList<>(set).stream()
                .filter(v -> v > last && v <= 100)
                .sorted()
                .toList();
    }

    private int roundToNearest5(int value) {
        return (int) (Math.round(value / 5.0) * 5);
    }

    // -------------------------------------------------------
    // Construction du message d'explication
    // -------------------------------------------------------
    private String buildReason(List<PlanningEvent> events,
                               int last, int avgStep, int proposed) {
        // Blocage répété : même % sur 2 derniers events
        if (events.size() >= 2) {
            int prev = events.get(1).getCompletionPercentage();
            if (prev == last) {
                return String.format(
                        "Progression bloquée à %d%% — vérifiez les obstacles", last);
            }
        }

        if (proposed == 100) {
            return "Proche de la fin — terminer la tâche ?";
        }

        return String.format(
                "Dernière session : %d%% — progression moyenne : +%d%%",
                last, avgStep);
    }
}