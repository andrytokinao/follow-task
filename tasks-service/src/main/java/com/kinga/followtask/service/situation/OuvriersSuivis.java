package com.kinga.followtask.service.situation;

import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.repository.ProjectRepository;
import com.kinga.followtask.repository.UserRepository;
import com.kinga.followtask.service.DirectionService;
import com.kinga.followtask.service.rappel.PopulationOuvriers;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Ouvriers dont la direction suit le planning : ceux des rappels (DT-004),
 * assignables dans au moins un espace de travail. Partagé par la situation du
 * jour (DT-005) et les présences du Gantt de direction.
 */
@Component
@RequiredArgsConstructor
public class OuvriersSuivis {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final PopulationOuvriers population;

    /** Un ouvrier suivi et les espaces où il est assignable. */
    public record Ouvrier(UserApp user, List<Project> espaces) {
    }

    /** @param departement nom de l'espace de travail, null pour toute la société */
    public List<Ouvrier> de(String departement) {
        Map<String, Project> espacesParPrefixe = projectRepository.findAll().stream()
                .filter(p -> p.getPrefix() != null)
                .collect(Collectors.toMap(Project::getPrefix, Function.identity(), (a, b) -> a));
        List<Ouvrier> ouvriers = new ArrayList<>();
        for (UserApp user : userRepository.findAllActifs()) {
            List<Project> espaces = population.espacesAssignables(user).stream()
                    .map(espacesParPrefixe::get)
                    .filter(Objects::nonNull)
                    .toList();
            boolean suivi = !espaces.isEmpty() && (!StringUtils.hasText(departement)
                    || espaces.stream().anyMatch(e -> departement.equals(DirectionService.nomDepartement(e))));
            if (suivi) {
                ouvriers.add(new Ouvrier(user, espaces));
            }
        }
        return ouvriers;
    }
}
