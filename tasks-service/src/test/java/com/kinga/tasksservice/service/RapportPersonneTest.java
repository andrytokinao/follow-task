package com.kinga.tasksservice.service;

import com.kinga.followtask.dto.rapport.RapportPersonneDTO;
import com.kinga.followtask.dto.rapport.RapportPersonnesDTO;
import com.kinga.followtask.dto.rapport.TachePersonneDTO;
import com.kinga.followtask.dto.rapport.TempsParProjetDTO;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueMembership;
import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.IssueRole;
import com.kinga.followtask.repository.EventRepository;
import com.kinga.followtask.repository.GroupeUserRepository;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.ProjectRepository;
import com.kinga.followtask.repository.UserAppRepository;
import com.kinga.followtask.service.RapportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Rapport d'activité d'une personne : ce qui entre dans la liste de ses tâches.
 *
 * <p>Le point vérifié ici est une distinction du modèle, pas un détail
 * d'affichage : une demande racine est un projet. Elle a sa place dans la
 * répartition du temps — c'est là qu'on lit sur quoi la personne travaille —
 * mais pas dans le détail des tâches, où elle ferait doublon avec les tâches
 * qu'elle contient.</p>
 */
class RapportPersonneTest {

    private static final String IDENTIFIANT = "u1";

    private final IssueRepository issueRepository = mock(IssueRepository.class);
    private final EventRepository eventRepository = mock(EventRepository.class);
    private final ProjectRepository projectRepository = mock(ProjectRepository.class);
    private final UserAppRepository userAppRepository = mock(UserAppRepository.class);
    private final GroupeUserRepository groupeUserRepository = mock(GroupeUserRepository.class);

    private final RapportService rapportService = new RapportService(
            issueRepository, eventRepository, projectRepository, userAppRepository, groupeUserRepository);

    private Project departement;
    private UserApp personne;
    private Issue projet;
    private Issue tache;

    @BeforeEach
    void preparer() {
        departement = new Project();
        departement.setId(1L);
        departement.setName("Bâtiment");
        departement.setPrefix("BAT");

        personne = new UserApp();
        personne.setId(IDENTIFIANT);
        personne.setUsername("jrakoto");
        personne.setFirstName("Jean");
        personne.setLastName("Rakoto");

        // Un projet — demande sans parent — et l'une de ses tâches.
        projet = demande(10L, "BAT-1", "Bâtiment Barikadimy", null);
        tache = demande(11L, "DEVIS-1", "Devis total", projet);
        projet.setChildren(new ArrayList<>(List.of(tache)));

        // La personne a travaillé deux heures sur la tâche, une heure saisie
        // directement sur le projet, et le projet lui est assigné.
        LocalDateTime maintenant = LocalDateTime.now();
        ajouterEvent(tache, maintenant.minusHours(2), maintenant);
        ajouterEvent(projet, maintenant.minusHours(1), maintenant);
        assigner(projet);

        when(projectRepository.findById(1L)).thenReturn(java.util.Optional.of(departement));
        when(userAppRepository.findAllById(anyList())).thenReturn(List.of(personne));
        when(eventRepository.findEventsByUserIdsAndIssues(anyList(), any(), any(), any(), any()))
                .thenReturn(List.of(tache.getEvents().get(0), projet.getEvents().get(0)));
        when(issueRepository.findAssigneesDansProjet(any(), anyList()))
                .thenReturn(List.of(projet));
    }

    @Test
    void seulesLesTachesFigurentAuDetail() {
        RapportPersonneDTO rapport = rapportPersonne();

        assertThat(rapport.taches())
                .extracting(TachePersonneDTO::cle)
                .containsExactly("DEVIS-1");
        assertThat(rapport.nombreTaches()).isEqualTo(1);
    }

    /**
     * Les heures saisies sur le projet lui-même ne disparaissent pas : elles
     * sortent du détail des tâches, pas du rapport. Le total et la répartition
     * les portent toujours — sinon filtrer l'affichage reviendrait à effacer du
     * travail réellement fait.
     */
    @Test
    void lesHeuresDuProjetRestentComptees() {
        RapportPersonneDTO rapport = rapportPersonne();

        assertThat(rapport.heuresPassees()).isEqualTo(3d);
        assertThat(rapport.repartitionParProjet())
                .extracting(TempsParProjetDTO::cleProjet, TempsParProjetDTO::heuresPassees)
                .containsExactly(org.assertj.core.api.Assertions.tuple("BAT-1", 3d));
    }

    /** La synthèse compte les mêmes tâches que le détail, jamais les projets. */
    @Test
    void laSyntheseNeCompteQueLesTaches() {
        RapportPersonnesDTO rapport = rapportService.genererRapportPersonnes(1L, List.of(IDENTIFIANT));

        assertThat(rapport.synthese().nombreTaches()).isEqualTo(1);
        assertThat(rapport.synthese().nombreProjets()).isEqualTo(1);
    }

    // ------------------------------------------------------------------
    // Montage
    // ------------------------------------------------------------------

    private RapportPersonneDTO rapportPersonne() {
        return rapportService.genererRapportPersonnes(1L, List.of(IDENTIFIANT)).personnes().get(0);
    }

    private Issue demande(Long id, String cle, String titre, Issue parent) {
        Issue issue = new Issue();
        issue.setId(id);
        issue.setIssueKey(cle);
        issue.setSummary(titre);
        issue.setParent(parent);
        issue.setProject(departement);
        issue.setEvents(new ArrayList<>());
        issue.setMemberships(new ArrayList<>());
        return issue;
    }

    private void ajouterEvent(Issue issue, LocalDateTime debut, LocalDateTime fin) {
        PlanningEvent event = new PlanningEvent();
        event.setId(issue.getId() * 100);
        event.setIssue(issue);
        event.setUser(personne);
        event.setStart(debut);
        event.setEnd(fin);
        event.setCompletionPercentage(0);
        issue.getEvents().add(event);
    }

    private void assigner(Issue issue) {
        IssueMembership adhesion = new IssueMembership();
        adhesion.setIssue(issue);
        adhesion.setUser(personne);
        adhesion.setRole(IssueRole.ASSIGNEE);
        adhesion.setAssignedAt(LocalDateTime.now().minusDays(1));
        issue.getMemberships().add(adhesion);
    }
}
