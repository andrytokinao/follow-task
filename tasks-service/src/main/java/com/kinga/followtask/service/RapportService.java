package com.kinga.followtask.service;

import com.kinga.followtask.dto.rapport.RapportProjetDTO;
import com.kinga.followtask.dto.rapport.StatutTache;
import com.kinga.followtask.dto.rapport.SyntheseProjetDTO;
import com.kinga.followtask.dto.rapport.TacheRapportDTO;
import com.kinga.followtask.dto.rapport.TempsParPersonneDTO;
import com.kinga.followtask.entity.Issue;
import com.kinga.followtask.entity.IssueMembership;
import com.kinga.followtask.entity.PlanningEvent;
import com.kinga.followtask.entity.Project;
import com.kinga.followtask.entity.UserApp;
import com.kinga.followtask.entity.enumapp.ExecutionStatus;
import com.kinga.followtask.entity.enumapp.IssueRole;
import com.kinga.followtask.repository.IssueRepository;
import com.kinga.utils.KingaUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

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

    private final IssueRepository issueRepository;

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
                // Texte brut : la description est saisie en HTML par l'éditeur
                // riche, la réinjecter telle quelle casserait le XHTML attendu
                // par la conversion PDF.
                KingaUtils.plainText(issueProjet.getDescription()),
                resolveDepartement(issueProjet),
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
        Project departement = issueProjet.getProject();
        if (departement == null) {
            return null;
        }
        if (StringUtils.hasText(departement.getName())) {
            return departement.getName();
        }
        return StringUtils.hasText(departement.getPrefix()) ? departement.getPrefix() : null;
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
