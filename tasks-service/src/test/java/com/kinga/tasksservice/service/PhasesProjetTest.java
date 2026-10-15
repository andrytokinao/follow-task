package com.kinga.tasksservice.service;

import com.kinga.followtask.dto.ChoixTypeSousTache;
import com.kinga.followtask.dto.TypesSousTacheParPhase;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueType;
import com.kinga.followtask.entity.Phase;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.Status;
import com.kinga.followtask.entity.enumapp.Niveau;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.IssueTypeRepository;
import com.kinga.followtask.repository.PhaseRepository;
import com.kinga.followtask.service.phase.AffectationPhase;
import com.kinga.followtask.service.phase.PhaseCouranteParStatut;
import com.kinga.followtask.service.phase.PhaseTacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Phases de projet (DT-001) : phase courante lue sur le statut du projet,
 * phase donnee a une nouvelle tache, liste des types proposes a la creation
 * d'une sous-tache.
 *
 * <p>Cas d'un bureau d'etudes : Preliminaire, APS, APD. « Note de calcul »
 * sert en APS et en APD, « Releve » en Preliminaire seulement, « Reunion »
 * dans aucune phase.</p>
 */
class PhasesProjetTest {

    private static final long ESPACE = 1L;

    private final PhaseRepository phaseRepository = mock(PhaseRepository.class);
    private final IssueRepository issueRepository = mock(IssueRepository.class);
    private final IssueTypeRepository issueTypeRepository = mock(IssueTypeRepository.class);

    private final PhaseCouranteParStatut resolveur = new PhaseCouranteParStatut(phaseRepository);
    private final AffectationPhase affectation = new AffectationPhase(resolveur);
    private final PhaseTacheService phaseTacheService = new PhaseTacheService(
            issueRepository, issueTypeRepository, phaseRepository, resolveur, affectation);

    private final Project espace = projet();
    private final Status statutPreliminaire = statut(10L, "Préliminaire");
    private final Status statutAps = statut(11L, "APS");
    private final Status statutApd = statut(12L, "APD");
    private final Status statutSuspendu = statut(13L, "Suspendu");

    private final Phase preliminaire = phase(100L, "Préliminaire", 1, statutPreliminaire);
    private final Phase aps = phase(101L, "APS", 2, statutAps);
    private final Phase apd = phase(102L, "APD", 3, statutApd);

    private final IssueType typeProjet = type(200L, "Projet", Niveau.PARENT);
    private final IssueType noteDeCalcul = type(201L, "Note de calcul", Niveau.SUB_TASK, aps, apd);
    private final IssueType releve = type(202L, "Relevé", Niveau.SUB_TASK, preliminaire);
    private final IssueType reunion = type(203L, "Réunion", Niveau.SUB_TASK);

    @BeforeEach
    void preparer() {
        when(phaseRepository.findVisibles(ESPACE)).thenReturn(List.of(preliminaire, aps, apd));
        when(issueTypeRepository.findByParents_Id(typeProjet.getId()))
                .thenReturn(List.of(reunion, releve, noteDeCalcul));
    }

    // -----------------------------------------------------------------
    // Phase courante
    // -----------------------------------------------------------------

    @Test
    void laPhaseCouranteEstCelleDuStatutDuProjet() {
        Issue projet = projet(statutAps);

        assertThat(resolveur.phaseCourante(projet)).contains(aps);
    }

    @Test
    void uneSousTacheDeSousTacheLitLeStatutDeLaRacine() {
        Issue projet = projet(statutApd);
        Issue tache = tache(projet, noteDeCalcul, null);
        Issue sousTache = tache(tache, noteDeCalcul, null);
        sousTache.setStatus(statutAps);

        assertThat(resolveur.phaseCourante(sousTache)).contains(apd);
    }

    @Test
    void unStatutSansPhaseNeDonneAucunePhaseCourante() {
        assertThat(resolveur.phaseCourante(projet(statutSuspendu))).isEmpty();
    }

    // -----------------------------------------------------------------
    // Phase d'une nouvelle tache
    // -----------------------------------------------------------------

    @Test
    void uneNouvelleTachePrendLaPhaseCouranteSiSonTypeYSert() {
        Phase phase = affectation.phaseInitiale(projet(statutApd), noteDeCalcul, null);

        assertThat(phase).isEqualTo(apd);
    }

    @Test
    void uneCorrectionDApsPendantLApdGardeLaPhaseDemandee() {
        Phase phase = affectation.phaseInitiale(projet(statutApd), noteDeCalcul, ref(aps));

        assertThat(phase).isEqualTo(aps);
    }

    @Test
    void unePhaseQueLeTypeNUtilisePasEstRefusee() {
        assertThatThrownBy(() -> affectation.phaseInitiale(projet(statutAps), releve, ref(aps)))
                .hasMessageContaining("Relevé");
    }

    @Test
    void horsPhaseCouranteUnTypeAUnePhaseLaGarde() {
        Phase phase = affectation.phaseInitiale(projet(statutApd), releve, null);

        assertThat(phase).isEqualTo(preliminaire);
    }

    @Test
    void horsPhaseCouranteUnTypeAPlusieursPhasesNeChoisitPas() {
        Phase phase = affectation.phaseInitiale(projet(statutSuspendu), noteDeCalcul, null);

        assertThat(phase).isNull();
    }

    @Test
    void unTypeSansPhaseDonneUneTacheSansPhase() {
        assertThat(affectation.phaseInitiale(projet(statutAps), reunion, null)).isNull();
    }

    @Test
    void unChangementDeTypeGardeLaPhaseSiLeNouveauTypeLUtilise() {
        Issue tache = tache(projet(statutApd), releve, preliminaire);
        IssueType releveEtNote = type(204L, "Relevé et note", Niveau.SUB_TASK, preliminaire, aps);

        assertThat(affectation.phaseApresChangementDeType(tache, releveEtNote)).isEqualTo(preliminaire);
    }

    @Test
    void unTypeAPhasesExigeUnePhaseALaCorrection() {
        assertThatThrownBy(() -> affectation.verifierChoix(noteDeCalcul, null))
                .hasMessageContaining("choisissez");
        assertThat(affectation.verifierChoix(reunion, null)).isNull();
        assertThat(affectation.verifierChoix(noteDeCalcul, apd.getId())).isEqualTo(apd);
    }

    // -----------------------------------------------------------------
    // Types proposes a la creation d'une sous-tache
    // -----------------------------------------------------------------

    @Test
    void enApsSontProposesLesTypesDeLApsEtLesTypesSansPhase() {
        Issue projet = projet(statutAps);
        when(issueRepository.findById(projet.getId())).thenReturn(Optional.of(projet));

        TypesSousTacheParPhase types = phaseTacheService.typesSousTache(projet.getId());

        assertThat(types.phaseCourante()).isEqualTo(aps);
        assertThat(types.choix()).extracting(PhasesProjetTest::libelle).containsExactly(
                "Préliminaire/Relevé", "APS/Note de calcul", "APD/Note de calcul", "-/Réunion");
        assertThat(types.choix().stream().filter(ChoixTypeSousTache::proposee))
                .extracting(PhasesProjetTest::libelle)
                .containsExactly("APS/Note de calcul", "-/Réunion");
    }

    @Test
    void sansPhaseCouranteToutEstPropose() {
        Issue projet = projet(statutSuspendu);
        when(issueRepository.findById(anyLong())).thenReturn(Optional.of(projet));

        TypesSousTacheParPhase types = phaseTacheService.typesSousTache(projet.getId());

        assertThat(types.phaseCourante()).isNull();
        assertThat(types.choix()).allMatch(ChoixTypeSousTache::proposee);
    }

    // -----------------------------------------------------------------
    // Jeu de donnees
    // -----------------------------------------------------------------

    private static String libelle(ChoixTypeSousTache choix) {
        return (choix.phase() == null ? "-" : choix.phase().getName()) + "/" + choix.issueType().getName();
    }

    private static Project projet() {
        Project project = new Project();
        project.setId(ESPACE);
        return project;
    }

    private static Status statut(Long id, String nom) {
        Status status = new Status();
        status.setId(id);
        status.setDisplayName(nom);
        return status;
    }

    private Phase phase(Long id, String nom, int position, Status status) {
        Phase phase = new Phase();
        phase.setId(id);
        phase.setName(nom);
        phase.setPosition(position);
        phase.setProject(espace);
        phase.setStatuses(new ArrayList<>(List.of(status)));
        return phase;
    }

    /** Phase telle que l'envoie le formulaire : son id seulement. */
    private static Phase ref(Phase phase) {
        Phase ref = new Phase();
        ref.setId(phase.getId());
        return ref;
    }

    private IssueType type(Long id, String nom, Niveau niveau, Phase... phases) {
        IssueType type = new IssueType();
        type.setId(id);
        type.setName(nom);
        type.setLevel(niveau);
        type.setProject(espace);
        type.setPhases(new ArrayList<>(List.of(phases)));
        return type;
    }

    private Issue projet(Status status) {
        Issue projet = new Issue();
        projet.setId(500L);
        projet.setProject(espace);
        projet.setIssueType(typeProjet);
        projet.setStatus(status);
        return projet;
    }

    private Issue tache(Issue parent, IssueType type, Phase phase) {
        Issue tache = new Issue();
        tache.setId(parent.getId() + 1);
        tache.setParent(parent);
        tache.setProject(espace);
        tache.setIssueType(type);
        tache.setPhase(phase);
        return tache;
    }
}
