package com.kinga.followtask.service;

import com.kinga.followtask.dto.rapport.RapportPersonneDTO;
import com.kinga.followtask.dto.rapport.RapportPersonnesDTO;
import com.kinga.followtask.dto.rapport.RapportProjetDTO;
import com.kinga.followtask.dto.rapport.RapportProjetsDTO;
import com.kinga.followtask.dto.rapport.StatutTache;
import com.kinga.followtask.dto.rapport.SynthesePersonnesDTO;
import com.kinga.followtask.dto.rapport.SyntheseProjetDTO;
import com.kinga.followtask.dto.rapport.SyntheseProjetsDTO;
import com.kinga.followtask.dto.rapport.TachePersonneDTO;
import com.kinga.followtask.dto.rapport.TacheRapportDTO;
import com.kinga.followtask.dto.rapport.TempsParPersonneDTO;
import com.kinga.followtask.dto.rapport.TempsParProjetDTO;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueMembership;
import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.ExecutionStatus;
import com.kinga.followtask.entity.enumapp.IssueRole;
import com.kinga.followtask.repository.EventRepository;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.followtask.repository.ProjectRepository;
import com.kinga.followtask.repository.UserAppRepository;
import com.kinga.utils.KingaUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.ToIntFunction;

/**
 * Construction du rapport d'avancement d'un projet.
 *
 * Ce service ne produit qu'une donnée : le {@link RapportProjetDTO}. Le rendu
 * (page Thymeleaf, PDF, JSON pour Angular) est du ressort des couches
 * appelantes, de sorte que les trois canaux affichent nécessairement les mêmes
 * chiffres.
 *
 * Aucun calcul de durée ni d'avancement n'est réécrit ici : tout passe par
 * {@code Issue.getCurrentCompletionPercent()},
 * {@code Issue.getElapsedDuration()} et les utilitaires de {@code KingaUtils},
 * seules sources de vérité.
 */
@Service
@RequiredArgsConstructor
public class RapportService {

    private static final String SANS_EXECUTANT = "Non assigné";
    private static final double MINUTES_PAR_HEURE = 60d;

    /**
     * Garde-fou de la remontée vers la demande racine : une boucle parent/enfant
     * en base ferait tourner la recherche indéfiniment.
     */
    private static final int PROFONDEUR_MAX_RACINE = 50;

    private final IssueRepository issueRepository;
    private final EventRepository eventRepository;
    private final ProjectRepository projectRepository;
    private final UserAppRepository userAppRepository;

    // ------------------------------------------------------------------
    // Point d'entrée
    // ------------------------------------------------------------------

    /**
     * Charge l'issue racine d'un rapport et vérifie qu'elle en est bien une.
     *
     * Une issue est considérée comme racine si elle n'a pas de parent ou si
     * elle porte des enfants : une sous-tâche isolée n'a pas de rapport propre,
     * demander le sien est une erreur d'appel et non un rapport vide.
     *
     * @throws IllegalStateException    issue inexistante (traduit en 404)
     * @throws IllegalArgumentException issue qui n'est pas une racine (400)
     */
    @Transactional(readOnly = true)
    public Issue chargerIssueRacine(Long issueId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalStateException(
                        "Aucune demande d'identifiant " + issueId));

        boolean racine = issue.getParent() == null || !CollectionUtils.isEmpty(issue.getChildren());
        if (!racine) {
            throw new IllegalArgumentException(
                    "La demande " + issue.getIssueKey() + " est une sous-tâche : "
                            + "un rapport ne peut être établi que sur une demande racine.");
        }
        return issue;
    }

    /**
     * Rapport complet d'un projet. Point d'entrée unique des trois canaux de
     * consommation.
     */
    @Transactional(readOnly = true)
    public RapportProjetDTO genererRapport(Issue issueProjet) {
        Objects.requireNonNull(issueProjet, "issueProjet est obligatoire");

        List<Issue> taches = taches(issueProjet);
        List<TacheRapportDTO> tachesRapport = taches.stream()
                .map(this::toTacheRapportDTO)
                .toList();

        int avancementGlobal = calculerAvancementGlobal(taches);
        LocalDateTime dateFin = resolveDateFin(issueProjet);

        return new RapportProjetDTO(
                issueProjet.getSummary(),
                issueProjet.getIssueKey(),
                // Texte brut : la description est saisie en HTML par l'éditeur
                // riche, la réinjecter telle quelle casserait le XHTML attendu
                // par la conversion PDF.
                KingaUtils.plainText(issueProjet.getDescription()),
                resolveDepartement(issueProjet),
                issueProjet.getProject() == null ? null : issueProjet.getProject().getPrefix(),
                resolveChefDeProjet(issueProjet),
                resolveResponsables(issueProjet),
                issueProjet.getCreationDate(),
                dateFin,
                resolveStatutProjet(avancementGlobal, dateFin).getLibelle(),
                avancementGlobal,
                LocalDateTime.now(),
                calculerSynthese(issueProjet, taches, tachesRapport),
                tachesRapport);
    }

    /**
     * Rapport consolidé de plusieurs projets.
     *
     * <p>Chaque projet est produit par {@link #genererRapport(Issue)} : un
     * projet dit ici exactement ce qu'il dirait dans son rapport individuel. Ne
     * s'y ajoute qu'une synthèse commune, recalculée sur les événements de
     * l'ensemble plutôt qu'obtenue en additionnant les synthèses — sélectionner
     * un projet et l'un de ses descendants compterait sinon deux fois les mêmes
     * heures.</p>
     *
     * @param issueIds demandes racines à faire figurer, dans l'ordre voulu pour
     *                 le document ; les doublons sont ignorés
     * @throws IllegalArgumentException aucune demande fournie, ou l'une d'elles
     *                                  n'est pas une racine
     */
    @Transactional(readOnly = true)
    public RapportProjetsDTO genererRapportProjets(List<Long> issueIds) {
        List<Long> identifiants = distincts(issueIds);
        if (identifiants.isEmpty()) {
            throw new IllegalArgumentException(
                    "Aucun projet sélectionné : un rapport porte sur au moins une demande racine.");
        }

        List<Issue> racines = identifiants.stream().map(this::chargerIssueRacine).toList();
        List<RapportProjetDTO> projets = racines.stream().map(this::genererRapport).toList();

        // Dédoublonnage par identifiant d'événement : un projet et son
        // descendant partagent leurs événements, les compter deux fois
        // gonflerait le total du rapport sans que rien ne le signale.
        Map<Long, PlanningEvent> events = new LinkedHashMap<>();
        for (Issue racine : racines) {
            List<PlanningEvent> collectes = new ArrayList<>();
            collecterEvents(racine, collectes);
            for (PlanningEvent event : collectes) {
                events.putIfAbsent(event.getId(), event);
            }
        }
        List<PlanningEvent> tousLesEvents = new ArrayList<>(events.values());

        double totalHeures = enHeures(KingaUtils.getOwnElapsedDuration(tousLesEvents));
        double planifiees = enHeures(KingaUtils.getPlannedDuration(tousLesEvents));

        List<TempsParPersonneDTO> repartition = calculerTempsParPersonne(tousLesEvents, List.of())
                .stream()
                .filter(part -> part.heuresPassees() > 0)
                .toList();

        List<SyntheseProjetDTO> syntheses = projets.stream().map(RapportProjetDTO::synthese).toList();
        SyntheseProjetsDTO synthese = new SyntheseProjetsDTO(
                projets.size(),
                moyenne(projets.stream().map(RapportProjetDTO::avancementGlobal).toList()),
                totalHeures,
                planifiees,
                arrondir(totalHeures - planifiees),
                repartition.size(),
                somme(syntheses, SyntheseProjetDTO::nombreTaches),
                somme(syntheses, SyntheseProjetDTO::nombreTerminees),
                somme(syntheses, SyntheseProjetDTO::nombreEnCours),
                somme(syntheses, SyntheseProjetDTO::nombreEnRetard),
                somme(syntheses, SyntheseProjetDTO::nombreBloquees),
                somme(syntheses, SyntheseProjetDTO::nombreReportees),
                somme(syntheses, SyntheseProjetDTO::nombreNonDemarrees),
                repartition);

        // L'espace de travail n'intitule le rapport que s'il est le même pour
        // tous les projets retenus : rien n'interdit d'en mélanger.
        String departement = valeurCommune(projets.stream().map(RapportProjetDTO::departement).toList());
        String prefixe = valeurCommune(projets.stream().map(RapportProjetDTO::prefixeDepartement).toList());

        return new RapportProjetsDTO(departement, prefixe, LocalDateTime.now(), synthese, projets);
    }

    /**
     * Rapport d'activité d'une ou plusieurs personnes sur un espace de travail.
     *
     * <p>Symétrique du rapport de projet, et bâti sur les mêmes sources : les
     * heures viennent des événements de planning de la personne, l'avancement et
     * le statut de la tâche entière — une tâche est menée à plusieurs, son
     * avancement n'est pas divisible.</p>
     *
     * <p>Une personne sélectionnée figure toujours au rapport, même sans aucune
     * heure : son absence d'activité est une information, la faire disparaître
     * la ferait passer pour un oubli de sélection.</p>
     *
     * @param projectId espace de travail sur lequel l'activité est mesurée
     * @param userIds   personnes retenues, dans l'ordre voulu pour le document
     */
    @Transactional(readOnly = true)
    public RapportPersonnesDTO genererRapportPersonnes(Long projectId, List<String> userIds) {
        Objects.requireNonNull(projectId, "projectId est obligatoire");
        List<String> identifiants = distincts(userIds);
        if (identifiants.isEmpty()) {
            throw new IllegalArgumentException(
                    "Aucune personne sélectionnée : un rapport porte sur au moins un intervenant.");
        }

        Project departement = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalStateException(
                        "Aucun espace de travail d'identifiant " + projectId));

        // Les événements sont ramenés par personne puis filtrés sur l'espace de
        // travail de leur demande : PlanningEvent.project n'est pas toujours
        // renseigné, celui de la demande l'est.
        Map<String, List<PlanningEvent>> eventsParPersonne = new LinkedHashMap<>();
        for (PlanningEvent event : eventRepository.findEventsByUserIdsAndIssues(
                identifiants, null, null, null, null)) {
            if (event.getIssue() == null || !appartientAu(projectId, event)) {
                continue;
            }
            eventsParPersonne.computeIfAbsent(cle(event.getUser()), c -> new ArrayList<>()).add(event);
        }

        Map<String, List<Issue>> assigneesParPersonne = assigneesParPersonne(projectId, identifiants);

        // Le nom d'une personne sans aucun événement ni aucune tâche ne peut
        // venir que de la table des utilisateurs : sans cela, un intervenant
        // sans activité sortirait du rapport sans nom.
        Map<String, UserApp> personnes = new LinkedHashMap<>();
        userAppRepository.findAllById(identifiants).forEach(u -> personnes.put(u.getId(), u));

        double totalHeures = enHeures(KingaUtils.getOwnElapsedDuration(
                eventsParPersonne.values().stream().flatMap(List::stream).toList()));

        List<RapportPersonneDTO> rapports = new ArrayList<>();
        for (String identifiant : identifiants) {
            rapports.add(rapportPersonne(
                    identifiant,
                    personnes.get(identifiant),
                    eventsParPersonne.getOrDefault(identifiant, List.of()),
                    assigneesParPersonne.getOrDefault(identifiant, List.of()),
                    totalHeures));
        }

        return new RapportPersonnesDTO(
                resolveNomDepartement(departement),
                departement.getPrefix(),
                LocalDateTime.now(),
                synthesePersonnes(rapports, eventsParPersonne, assigneesParPersonne),
                rapports);
    }

    // ------------------------------------------------------------------
    // Calculs — visibilité paquet et non privée : les tests unitaires du même
    // paquet les exercent directement, sans passer par genererRapport().
    // ------------------------------------------------------------------

    /**
     * Avancement global du projet, seul endroit où la pondération des tâches est
     * décidée. Point d'extension unique : faire évoluer la règle ne demande de
     * toucher à rien d'autre dans ce service.
     *
     * <p>Règle appliquée : moyenne pondérée par la contribution de chaque tâche
     * au projet, le solde des 100 % étant réparti à parts égales entre les
     * tâches sans contribution définie.</p>
     *
     * <pre>
     * contributionEffective(t) = contribution(t) != null
     *     ? contribution(t)
     *     : (100 - Σ contributions définies) / nombre de tâches sans contribution
     *
     * avancementGlobal = Σ(contributionEffective(t) × %exécution(t)) / 100
     * </pre>
     *
     * <p>Tant que {@link #contributionProjet(Issue)} renvoie {@code null} pour
     * toute tâche — le champ n'existe pas encore dans le modèle — la formule se
     * réduit exactement à la moyenne simple des pourcentages, qui est le
     * comportement attendu aujourd'hui.</p>
     */
    int calculerAvancementGlobal(List<Issue> taches) {
        if (CollectionUtils.isEmpty(taches)) {
            return 0;
        }

        double sommeContributionsDefinies = 0d;
        int nombreSansContribution = 0;
        for (Issue tache : taches) {
            Double contribution = contributionProjet(tache);
            if (contribution == null) {
                nombreSansContribution++;
            } else {
                sommeContributionsDefinies += contribution;
            }
        }

        double solde = Math.max(0d, 100d - sommeContributionsDefinies);
        double partAutomatique = nombreSansContribution == 0 ? 0d : solde / nombreSansContribution;

        double cumul = 0d;
        for (Issue tache : taches) {
            Double contribution = contributionProjet(tache);
            double effective = contribution != null ? contribution : partAutomatique;
            cumul += effective * pourcentageExecution(tache);
        }

        return borner((int) Math.round(cumul / 100d));
    }

    /**
     * Poids d'une tâche dans son projet, en pourcentage, ou {@code null} si elle
     * n'en a pas de défini.
     *
     * <p>Le champ {@code contributionProjet} n'existe pas encore sur
     * {@code Issue}. Quand il sera ajouté, cette méthode est la seule à
     * modifier : {@code return tache.getContributionProjet();}.</p>
     */
    private Double contributionProjet(Issue tache) {
        return null;
    }

    TacheRapportDTO toTacheRapportDTO(Issue tache) {
        int pourcentage = pourcentageExecution(tache);
        StatutTache statut = resolveStatutTache(tache, pourcentage);

        double realisees = enHeures(KingaUtils.getOwnElapsedDuration(tache.getEvents()));
        double planifiees = enHeures(KingaUtils.getPlannedDuration(tache.getEvents()));

        return new TacheRapportDTO(
                tache.getSummary(),
                tache.getIssueKey(),
                statut,
                statut.getLibelle(),
                tache.getStatus() == null ? null : tache.getStatus().getDisplayName(),
                pourcentage,
                calculerTempsParPersonne(tache.getEvents(), tache.getAssignes()),
                realisees,
                planifiees,
                arrondir(realisees - planifiees),
                compterReports(tache.getEvents()));
    }

    /**
     * Chiffres d'ensemble du projet.
     *
     * Les compteurs par statut sont relus sur les DTO déjà construits plutôt que
     * recalculés sur les entités : la synthèse ne peut donc pas diverger du
     * détail affiché juste en dessous.
     */
    SyntheseProjetDTO calculerSynthese(Issue issueProjet,
                                       List<Issue> taches,
                                       List<TacheRapportDTO> tachesRapport) {

        List<PlanningEvent> tousLesEvents = new ArrayList<>();
        collecterEvents(issueProjet, tousLesEvents);

        // Le total vient de l'entité (récursif sur les sous-tâches), la
        // répartition des mêmes événements par personne : les deux ne peuvent
        // pas se contredire, une durée étant additive.
        double totalHeures = enHeures(issueProjet.getElapsedDuration());
        double planifiees = enHeures(KingaUtils.getPlannedDuration(tousLesEvents));

        List<TempsParPersonneDTO> repartition = calculerTempsParPersonne(tousLesEvents, List.of())
                .stream()
                .filter(part -> part.heuresPassees() > 0)
                .toList();

        return new SyntheseProjetDTO(
                totalHeures,
                planifiees,
                arrondir(totalHeures - planifiees),
                repartition.size(),
                tachesRapport.size(),
                compter(tachesRapport, StatutTache.TERMINE),
                compter(tachesRapport, StatutTache.EN_COURS),
                compter(tachesRapport, StatutTache.EN_RETARD),
                compter(tachesRapport, StatutTache.BLOQUE),
                compter(tachesRapport, StatutTache.REPORTE),
                compter(tachesRapport, StatutTache.NON_DEMARRE),
                (int) taches.stream().filter(t -> CollectionUtils.isEmpty(t.getEvents())).count(),
                (int) taches.stream().filter(t -> CollectionUtils.isEmpty(t.getAssignes())).count(),
                repartition);
    }

    /**
     * Répartition du temps passé entre les exécutants d'un lot d'événements.
     *
     * Les événements sont regroupés par personne puis confiés en bloc à
     * {@code KingaUtils.getOwnElapsedDuration(...)} : la distinction entre
     * événement terminé, en cours et pas encore démarré reste au même endroit
     * pour toute l'application.
     *
     * @param assignes personnes à faire figurer même sans événement. Une tâche
     *                 assignée sur laquelle personne n'a travaillé est
     *                 précisément ce qu'un rapport doit montrer ; sans cela elle
     *                 disparaît du tableau.
     */
    List<TempsParPersonneDTO> calculerTempsParPersonne(List<PlanningEvent> events, List<UserApp> assignes) {
        if (CollectionUtils.isEmpty(events) && CollectionUtils.isEmpty(assignes)) {
            return List.of();
        }

        // Regroupement par identifiant : deux personnes peuvent porter le même
        // nom affichable, et UserApp ne peut pas servir de clé de Map (son
        // equals() de Lombok parcourt des collections chargées à la demande).
        Map<String, List<PlanningEvent>> parExecutant = new LinkedHashMap<>();
        Map<String, String> nomParExecutant = new LinkedHashMap<>();

        if (events != null) {
            for (PlanningEvent event : events) {
                String cle = cle(event.getUser());
                parExecutant.computeIfAbsent(cle, k -> new ArrayList<>()).add(event);
                nomParExecutant.putIfAbsent(cle, nomAffichable(event.getUser()));
            }
        }
        if (assignes != null) {
            for (UserApp assigne : assignes) {
                String cle = cle(assigne);
                parExecutant.computeIfAbsent(cle, k -> new ArrayList<>());
                nomParExecutant.putIfAbsent(cle, nomAffichable(assigne));
            }
        }

        long minutesTotal = KingaUtils.getOwnElapsedDuration(events).toMinutes();

        List<TempsParPersonneDTO> repartition = new ArrayList<>();
        for (Map.Entry<String, List<PlanningEvent>> entree : parExecutant.entrySet()) {
            long minutes = KingaUtils.getOwnElapsedDuration(entree.getValue()).toMinutes();
            int part = minutesTotal <= 0
                    ? 0
                    : (int) Math.round(minutes * 100d / minutesTotal);
            repartition.add(new TempsParPersonneDTO(
                    nomParExecutant.get(entree.getKey()),
                    arrondir(minutes / MINUTES_PAR_HEURE),
                    part));
        }

        // Le plus gros contributeur en premier : c'est l'information que l'on
        // cherche en ouvrant le tableau, et l'ordre des parts du graphique.
        repartition.sort(Comparator.comparingDouble(TempsParPersonneDTO::heuresPassees).reversed());
        return repartition;
    }

    /**
     * Statut d'une tâche.
     *
     * L'avancement prime : une tâche à 100 % est terminée quoi qu'il arrive.
     * Vient ensuite l'état d'exécution de l'événement de référence — bloqué ou
     * reporté sont des situations que le seul pourcentage masque complètement.
     * À défaut, l'échéance retenue est la fin planifiée la plus tardive des
     * événements, le modèle n'en portant pas d'autre.
     */
    StatutTache resolveStatutTache(Issue tache, int pourcentage) {
        if (pourcentage >= 100) {
            return StatutTache.TERMINE;
        }

        PlanningEvent reference = tache.resolveCurrentEvent();
        ExecutionStatus etat = reference == null ? null : reference.getExecutionStatus();
        if (etat == ExecutionStatus.BLOCKED) {
            return StatutTache.BLOQUE;
        }
        if (etat == ExecutionStatus.POSTPONED) {
            return StatutTache.REPORTE;
        }

        if (pourcentage <= 0) {
            return StatutTache.NON_DEMARRE;
        }
        LocalDateTime echeance = finPlanifiee(tache.getEvents());
        return echeance != null && echeance.isBefore(LocalDateTime.now())
                ? StatutTache.EN_RETARD
                : StatutTache.EN_COURS;
    }

    // ------------------------------------------------------------------
    // Rapport par personne
    // ------------------------------------------------------------------

    /**
     * Activité d'une personne : ses tâches, ses heures, sa répartition entre
     * les projets.
     *
     * @param totalHeuresRapport temps cumulé de toutes les personnes du
     *                           rapport, dont on déduit la part de celle-ci
     */
    private RapportPersonneDTO rapportPersonne(String identifiant,
                                               UserApp personne,
                                               List<PlanningEvent> sesEvents,
                                               List<Issue> sesAssignations,
                                               double totalHeuresRapport) {

        // Une tâche entre au rapport soit parce que la personne y a travaillé,
        // soit parce qu'elle lui est assignée : les deux cas se rejoignent ici.
        Map<Long, Issue> taches = new LinkedHashMap<>();
        Map<Long, List<PlanningEvent>> eventsParTache = new LinkedHashMap<>();
        for (PlanningEvent event : sesEvents) {
            Issue tache = event.getIssue();
            taches.putIfAbsent(tache.getId(), tache);
            eventsParTache.computeIfAbsent(tache.getId(), c -> new ArrayList<>()).add(event);
        }
        for (Issue assignation : sesAssignations) {
            taches.putIfAbsent(assignation.getId(), assignation);
        }

        List<TachePersonneDTO> lignes = new ArrayList<>();
        for (Issue tache : taches.values()) {
            lignes.add(ligneTache(tache, eventsParTache.getOrDefault(tache.getId(), List.of()), identifiant));
        }
        // Le plus gros poste de travail en premier ; à temps égal, l'ordre des
        // clés, seul critère stable entre deux éditions du rapport.
        lignes.sort(Comparator.comparingDouble(TachePersonneDTO::heuresPassees).reversed()
                .thenComparing(ligne -> ligne.cle() == null ? "" : ligne.cle()));

        double heures = enHeures(KingaUtils.getOwnElapsedDuration(sesEvents));
        double planifiees = enHeures(KingaUtils.getPlannedDuration(sesEvents));
        List<TempsParProjetDTO> repartition = repartitionParProjet(taches.values(), eventsParTache, heures);

        return new RapportPersonneDTO(
                nomAffichable(personne),
                personne == null ? identifiant : personne.getUsername(),
                personne == null ? null : personne.getEmail(),
                heures,
                planifiees,
                arrondir(heures - planifiees),
                totalHeuresRapport <= 0 ? 0 : (int) Math.round(heures * 100d / totalHeuresRapport),
                moyenne(lignes.stream().map(TachePersonneDTO::pourcentageExecution).toList()),
                repartition.size(),
                lignes.size(),
                compterPersonne(lignes, StatutTache.TERMINE),
                compterPersonne(lignes, StatutTache.EN_COURS),
                compterPersonne(lignes, StatutTache.EN_RETARD),
                compterPersonne(lignes, StatutTache.BLOQUE),
                compterPersonne(lignes, StatutTache.REPORTE),
                compterPersonne(lignes, StatutTache.NON_DEMARRE),
                repartition,
                lignes);
    }

    /**
     * Une tâche vue depuis une personne : ses heures à elle, l'avancement de la
     * tâche entière.
     */
    private TachePersonneDTO ligneTache(Issue tache, List<PlanningEvent> sesEvents, String identifiant) {
        int pourcentage = pourcentageExecution(tache);
        StatutTache statut = resolveStatutTache(tache, pourcentage);
        Issue projet = racine(tache);

        double realisees = enHeures(KingaUtils.getOwnElapsedDuration(sesEvents));
        double planifiees = enHeures(KingaUtils.getPlannedDuration(sesEvents));

        return new TachePersonneDTO(
                tache.getIssueKey(),
                tache.getSummary(),
                projet.getIssueKey(),
                projet.getSummary(),
                statut,
                statut.getLibelle(),
                tache.getStatus() == null ? null : tache.getStatus().getDisplayName(),
                pourcentage,
                realisees,
                planifiees,
                arrondir(realisees - planifiees),
                compterReports(sesEvents),
                estAssignee(tache, identifiant));
    }

    /**
     * Répartition des heures d'une personne entre les projets de ses tâches.
     *
     * Un projet sur lequel elle n'a encore aucune heure y figure à 0 h : la
     * tâche lui est assignée, c'est une charge à venir et non une absence.
     */
    private List<TempsParProjetDTO> repartitionParProjet(Collection<Issue> taches,
                                                         Map<Long, List<PlanningEvent>> eventsParTache,
                                                         double totalPersonne) {
        Map<Long, Issue> projets = new LinkedHashMap<>();
        Map<Long, List<PlanningEvent>> eventsParProjet = new LinkedHashMap<>();
        for (Issue tache : taches) {
            Issue projet = racine(tache);
            projets.putIfAbsent(projet.getId(), projet);
            eventsParProjet.computeIfAbsent(projet.getId(), c -> new ArrayList<>())
                    .addAll(eventsParTache.getOrDefault(tache.getId(), List.of()));
        }

        List<TempsParProjetDTO> repartition = new ArrayList<>();
        for (Map.Entry<Long, Issue> entree : projets.entrySet()) {
            double heures = enHeures(KingaUtils.getOwnElapsedDuration(
                    eventsParProjet.getOrDefault(entree.getKey(), List.of())));
            int part = totalPersonne <= 0 ? 0 : (int) Math.round(heures * 100d / totalPersonne);
            repartition.add(new TempsParProjetDTO(
                    entree.getValue().getIssueKey(), entree.getValue().getSummary(), heures, part));
        }
        repartition.sort(Comparator.comparingDouble(TempsParProjetDTO::heuresPassees).reversed());
        return repartition;
    }

    /**
     * Chiffres d'ensemble d'un rapport par personne.
     *
     * Les heures s'additionnent — un événement a un seul exécutant — mais pas
     * les tâches : deux personnes sur la même tâche ne font qu'une tâche, les
     * compteurs de statut sont donc établis sur l'ensemble dédoublonné.
     */
    private SynthesePersonnesDTO synthesePersonnes(List<RapportPersonneDTO> rapports,
                                                   Map<String, List<PlanningEvent>> eventsParPersonne,
                                                   Map<String, List<Issue>> assigneesParPersonne) {

        Map<Long, Issue> taches = new LinkedHashMap<>();
        eventsParPersonne.values().forEach(liste -> liste.forEach(
                event -> taches.putIfAbsent(event.getIssue().getId(), event.getIssue())));
        assigneesParPersonne.values().forEach(liste -> liste.forEach(
                issue -> taches.putIfAbsent(issue.getId(), issue)));

        Set<Long> projets = new LinkedHashSet<>();
        Map<StatutTache, Integer> compteurs = new EnumMap<>(StatutTache.class);
        for (Issue tache : taches.values()) {
            projets.add(racine(tache).getId());
            compteurs.merge(resolveStatutTache(tache, pourcentageExecution(tache)), 1, Integer::sum);
        }

        double totalHeures = arrondir(rapports.stream()
                .mapToDouble(RapportPersonneDTO::heuresPassees).sum());
        double planifiees = arrondir(rapports.stream()
                .mapToDouble(RapportPersonneDTO::heuresPlanifiees).sum());

        List<TempsParPersonneDTO> repartition = rapports.stream()
                .filter(rapport -> rapport.heuresPassees() > 0)
                .map(rapport -> new TempsParPersonneDTO(
                        rapport.nomPersonne(), rapport.heuresPassees(), rapport.partDuTemps()))
                .sorted(Comparator.comparingDouble(TempsParPersonneDTO::heuresPassees).reversed())
                .toList();

        return new SynthesePersonnesDTO(
                rapports.size(),
                totalHeures,
                planifiees,
                arrondir(totalHeures - planifiees),
                projets.size(),
                taches.size(),
                compteurs.getOrDefault(StatutTache.TERMINE, 0),
                compteurs.getOrDefault(StatutTache.EN_COURS, 0),
                compteurs.getOrDefault(StatutTache.EN_RETARD, 0),
                compteurs.getOrDefault(StatutTache.BLOQUE, 0),
                compteurs.getOrDefault(StatutTache.REPORTE, 0),
                compteurs.getOrDefault(StatutTache.NON_DEMARRE, 0),
                repartition);
    }

    /** Tâches de l'espace de travail assignées à chacune des personnes visées. */
    private Map<String, List<Issue>> assigneesParPersonne(Long projectId, List<String> identifiants) {
        Map<String, List<Issue>> parPersonne = new LinkedHashMap<>();
        for (Issue issue : issueRepository.findAssigneesDansProjet(projectId, identifiants)) {
            // La requête retient toute adhésion ouverte ; seules celles qui
            // valent assignation comptent ici, d'où le second filtre par
            // getAssignes(), qui porte la règle des rôles.
            for (UserApp assigne : issue.getAssignes()) {
                String identifiant = cle(assigne);
                if (identifiants.contains(identifiant)) {
                    parPersonne.computeIfAbsent(identifiant, c -> new ArrayList<>()).add(issue);
                }
            }
        }
        return parPersonne;
    }

    private boolean estAssignee(Issue tache, String identifiant) {
        return tache.getAssignes().stream()
                .anyMatch(assigne -> assigne != null && identifiant.equals(assigne.getId()));
    }

    /**
     * Espace de travail d'un événement, lu sur sa demande.
     *
     * {@code PlanningEvent.project} n'est pas toujours renseigné — il l'est
     * selon le chemin de création de l'événement — alors que celui de la
     * demande l'est : filtrer sur lui seul écarterait de vrais événements.
     */
    private boolean appartientAu(Long projectId, PlanningEvent event) {
        Issue issue = event.getIssue();
        if (issue != null && issue.getProject() != null) {
            return projectId.equals(issue.getProject().getId());
        }
        return event.getProject() != null && projectId.equals(event.getProject().getId());
    }

    /**
     * Demande racine dont dépend une tâche, c'est-à-dire son « projet ».
     *
     * La remontée est bornée : une boucle parent/enfant en base, qu'aucune
     * contrainte n'interdit, ferait sinon tourner la recherche indéfiniment.
     */
    private Issue racine(Issue tache) {
        Issue courante = tache;
        for (int profondeur = 0; profondeur < PROFONDEUR_MAX_RACINE && courante.getParent() != null; profondeur++) {
            courante = courante.getParent();
        }
        return courante;
    }

    private int compterPersonne(List<TachePersonneDTO> taches, StatutTache statut) {
        return (int) taches.stream().filter(tache -> tache.statut() == statut).count();
    }

    // ------------------------------------------------------------------
    // Utilitaires internes
    // ------------------------------------------------------------------

    /** Tâches du rapport : les enfants directs de l'issue racine. */
    private List<Issue> taches(Issue issueProjet) {
        if (CollectionUtils.isEmpty(issueProjet.getChildren())) {
            return List.of();
        }
        return issueProjet.getChildren().stream()
                .filter(Objects::nonNull)
                .toList();
    }

    /** Avancement d'une tâche, tel que déjà calculé par l'entité. */
    private int pourcentageExecution(Issue tache) {
        Integer pourcentage = tache.getCurrentCompletionPercent();
        return pourcentage == null ? 0 : borner(pourcentage);
    }

    /**
     * Événements nés d'un report. Le test porte sur la clé étrangère, il ne
     * déclenche donc pas le chargement de l'événement d'origine.
     */
    private int compterReports(List<PlanningEvent> events) {
        if (CollectionUtils.isEmpty(events)) {
            return 0;
        }
        return (int) events.stream()
                .filter(e -> e.getPostponedFrom() != null)
                .count();
    }

    private int compter(List<TacheRapportDTO> taches, StatutTache statut) {
        return (int) taches.stream().filter(t -> t.statut() == statut).count();
    }

    private String cle(UserApp utilisateur) {
        return utilisateur == null || utilisateur.getId() == null
                ? SANS_EXECUTANT
                : utilisateur.getId();
    }

    private StatutTache resolveStatutProjet(int avancementGlobal, LocalDateTime dateFin) {
        if (avancementGlobal >= 100) {
            return StatutTache.TERMINE;
        }
        if (avancementGlobal <= 0) {
            return StatutTache.NON_DEMARRE;
        }
        return dateFin != null && dateFin.isBefore(LocalDateTime.now())
                ? StatutTache.EN_RETARD
                : StatutTache.EN_COURS;
    }

    /**
     * Fin du projet : l'événement planifié le plus tardif, tâches et
     * sous-tâches comprises. {@code null} si rien n'est planifié.
     */
    private LocalDateTime resolveDateFin(Issue issueProjet) {
        List<PlanningEvent> events = new ArrayList<>();
        collecterEvents(issueProjet, events);
        return finPlanifiee(events);
    }

    private LocalDateTime finPlanifiee(List<PlanningEvent> events) {
        if (CollectionUtils.isEmpty(events)) {
            return null;
        }
        return events.stream()
                .map(PlanningEvent::getEndTime)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);
    }

    /**
     * Collecte récursive des événements. On n'utilise pas
     * {@code Issue.getAllEvents()} : celui-ci ajoute les événements des enfants
     * dans la liste de l'entité elle-même, donc dans la collection persistante.
     */
    private void collecterEvents(Issue issue, List<PlanningEvent> cible) {
        if (issue == null) {
            return;
        }
        if (!CollectionUtils.isEmpty(issue.getEvents())) {
            cible.addAll(issue.getEvents());
        }
        if (!CollectionUtils.isEmpty(issue.getChildren())) {
            for (Issue enfant : issue.getChildren()) {
                collecterEvents(enfant, cible);
            }
        }
    }

    /**
     * Département de rattachement, c'est-à-dire l'espace de travail que
     * {@code Issue.project} désigne dans ce modèle.
     *
     * <p>Attention au vocabulaire : le « projet » du rapport est l'issue racine,
     * pas cette entité. Le repli sur le préfixe évite une case vide sur les
     * espaces dont le nom n'a jamais été saisi, le préfixe étant lui obligatoire
     * puisqu'il compose les clés de demande.</p>
     */
    private String resolveDepartement(Issue issueProjet) {
        return resolveNomDepartement(issueProjet.getProject());
    }

    /** Voir {@link #resolveDepartement(Issue)} : même règle, à partir de l'entité. */
    private String resolveNomDepartement(Project departement) {
        if (departement == null) {
            return null;
        }
        if (StringUtils.hasText(departement.getName())) {
            return departement.getName();
        }
        return StringUtils.hasText(departement.getPrefix()) ? departement.getPrefix() : null;
    }

    /** Valeurs non nulles, sans doublon, dans l'ordre reçu. */
    private <T> List<T> distincts(List<T> valeurs) {
        if (CollectionUtils.isEmpty(valeurs)) {
            return List.of();
        }
        return valeurs.stream().filter(Objects::nonNull).distinct().toList();
    }

    private int somme(List<SyntheseProjetDTO> syntheses, ToIntFunction<SyntheseProjetDTO> compteur) {
        return syntheses.stream().mapToInt(compteur).sum();
    }

    /** Moyenne simple, arrondie ; 0 sur une liste vide. */
    private int moyenne(List<Integer> valeurs) {
        if (CollectionUtils.isEmpty(valeurs)) {
            return 0;
        }
        return (int) Math.round(valeurs.stream().mapToInt(Integer::intValue).average().orElse(0d));
    }

    /**
     * Valeur partagée par toutes les entrées, ou {@code null} si elles divergent
     * — auquel cas aucune ne peut représenter l'ensemble.
     */
    private String valeurCommune(List<String> valeurs) {
        List<String> distinctes = valeurs.stream().filter(Objects::nonNull).distinct().toList();
        return distinctes.size() == 1 ? distinctes.get(0) : null;
    }

    /**
     * Responsable du projet.
     *
     * <p>Le rôle {@code ADMIN} d'une demande est la seule notion de responsable
     * que porte le modèle ; rien ne l'attribue aujourd'hui — toute assignation
     * pose {@code ASSIGNEE} — mais la règle est écrite ici pour que le rapport
     * en tienne compte dès que ce sera le cas.</p>
     *
     * <p>À défaut on retient le rapporteur, c'est-à-dire l'auteur de la demande,
     * qui n'est renseigné qu'à la création : les demandes plus anciennes ou
     * importées n'en ont pas. Dans ce cas la méthode renvoie {@code null} plutôt
     * qu'un libellé de repli — « Non assigné » laissait croire à une erreur
     * d'assignation alors que le champ n'a simplement jamais été rempli.</p>
     */
    private String resolveChefDeProjet(Issue issueProjet) {
        String responsable = issueProjet.getActiveMemberships().stream()
                .filter(m -> m.getRole() == IssueRole.ADMIN)
                .map(IssueMembership::getUser)
                .map(this::nomOuNull)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);

        return responsable != null ? responsable : nomOuNull(issueProjet.getReporter());
    }

    /**
     * Personnes assignées à la demande racine.
     *
     * Elles ne sont pas le chef de projet : dans ce modèle, assigner quelqu'un
     * ne le désigne pas responsable. Les deux informations sont donc portées
     * séparément par le rapport.
     */
    private List<String> resolveResponsables(Issue issueProjet) {
        List<String> noms = issueProjet.getAssignes().stream()
                .map(this::nomOuNull)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (!noms.isEmpty()) {
            return noms;
        }

        // Demandes antérieures aux adhésions : seul le champ historique
        // « assigne » est rempli, et lui seul dit encore qui s'en occupe.
        String historique = nomOuNull(issueProjet.getAssigne());
        return historique == null ? List.of() : List.of(historique);
    }

    /**
     * Nom d'un exécutant. Un événement sans utilisateur en a bel et bien un
     * d'inconnu, le libellé de repli a donc ici un sens — au contraire des
     * champs d'identité du projet, qui utilisent {@link #nomOuNull(UserApp)}.
     */
    private String nomAffichable(UserApp utilisateur) {
        String nom = nomOuNull(utilisateur);
        return nom == null ? SANS_EXECUTANT : nom;
    }

    /** Nom affichable, ou {@code null} si l'utilisateur est absent ou anonyme. */
    private String nomOuNull(UserApp utilisateur) {
        if (utilisateur == null) {
            return null;
        }
        String nom = (defaut(utilisateur.getLastName()) + " " + defaut(utilisateur.getFirstName())).trim();
        if (StringUtils.hasText(nom)) {
            return nom;
        }
        return StringUtils.hasText(utilisateur.getUsername()) ? utilisateur.getUsername() : null;
    }

    private String defaut(String valeur) {
        return valeur == null ? "" : valeur;
    }

    private double enHeures(Duration duree) {
        return duree == null ? 0d : arrondir(duree.toMinutes() / MINUTES_PAR_HEURE);
    }

    /** Deux décimales : au-delà, l'affichage donnerait une fausse précision. */
    private double arrondir(double valeur) {
        return Math.round(valeur * 100d) / 100d;
    }

    private int borner(int pourcentage) {
        return Math.min(100, Math.max(0, pourcentage));
    }
}
