/**
 * Miroir exact des records du paquet `com.kinga.followtask.dto.rapport`.
 *
 * Ces types décrivent la réponse de `GET /api/rapports/{issueId}` : l'aperçu
 * Angular est un rendu natif de ces données, et non une réutilisation du HTML
 * produit par le template Thymeleaf.
 */

export type StatutTache =
  | 'NON_DEMARRE'
  | 'EN_COURS'
  | 'EN_RETARD'
  | 'BLOQUE'
  | 'REPORTE'
  | 'TERMINE';

/**
 * Palette des parts du graphique de répartition, dans l'ordre d'affichage.
 *
 * Doit rester identique à `GraphiqueService.COULEURS` côté serveur, sans quoi
 * une même personne changerait de couleur entre l'aperçu et le PDF.
 */
export const COULEURS_REPARTITION = [
  '#1565c0', '#2f9e44', '#f0932b', '#d64545',
  '#7048e8', '#0c8599', '#b08900', '#e8590c'
];

export interface TempsParPersonneDTO {
  nomPersonne: string;
  /** Heures décimales. */
  heuresPassees: number;
  /** Part de cette personne dans le total, 0-100. */
  pourcentageDuTemps: number;
}

export interface TacheRapportDTO {
  nom: string;
  /** Clé de la demande (« PRJ-34 ») : deux tâches peuvent porter le même nom. */
  cle: string | null;
  statut: StatutTache;
  /** Libellé prêt à afficher, calculé par le serveur. */
  statutLibelle: string;
  /** Statut configuré du workflow, affiché en regard du statut dérivé. */
  statutWorkflow: string | null;
  pourcentageExecution: number;
  tempsParPersonne: TempsParPersonneDTO[];
  totalHeuresPassees: number;
  heuresPlanifiees: number;
  /** Réalisé - planifié : positif si la tâche déborde. */
  ecartHeures: number;
  nombreReports: number;
}

export interface SyntheseProjetDTO {
  totalHeures: number;
  heuresPlanifiees: number;
  ecartHeures: number;
  nombreIntervenants: number;
  nombreTaches: number;
  nombreTerminees: number;
  nombreEnCours: number;
  nombreEnRetard: number;
  nombreBloquees: number;
  nombreReportees: number;
  nombreNonDemarrees: number;
  tachesSansPlanning: number;
  tachesSansAssigne: number;
  repartitionParPersonne: TempsParPersonneDTO[];
}

export interface RapportProjetDTO {
  titre: string;
  /** Clé de la demande racine (« PRJ-12 »). */
  cle: string | null;
  description: string | null;
  /** Préfixe de l'espace de travail, nécessaire pour bâtir l'adresse d'une demande. */
  prefixeDepartement: string | null;
  /**
   * Espace de travail auquel la demande est rattachée (`Issue.project`).
   * Le « projet » du rapport est l'issue racine, pas cette entité.
   */
  departement: string | null;
  /** Responsable désigné, ou null s'il n'y en a pas. */
  chefDeProjet: string | null;
  /** Personnes assignées à la demande racine — distinctes du chef de projet. */
  responsables: string[];
  /** ISO-8601, date de création de la demande racine. */
  dateDebut: string | null;
  dateFin: string | null;
  statut: string;
  avancementGlobal: number;
  genereLe: string | null;
  synthese: SyntheseProjetDTO;
  taches: TacheRapportDTO[];
}

/* ==========================================================================
   Rapport composé : projets, personnes, équipes dans un même document.
   Miroir des records du même paquet ; voir `RapportCompositeDTO` côté serveur.
   ========================================================================== */

export interface SyntheseProjetsDTO {
  nombreProjets: number;
  /** Moyenne simple des avancements : le modèle ne porte pas de poids de projet. */
  avancementMoyen: number;
  totalHeures: number;
  heuresPlanifiees: number;
  ecartHeures: number;
  nombreIntervenants: number;
  nombreTaches: number;
  nombreTerminees: number;
  nombreEnCours: number;
  nombreEnRetard: number;
  nombreBloquees: number;
  nombreReportees: number;
  nombreNonDemarrees: number;
  repartitionParPersonne: TempsParPersonneDTO[];
}

export interface RapportProjetsDTO {
  departement: string | null;
  prefixeDepartement: string | null;
  genereLe: string | null;
  synthese: SyntheseProjetsDTO;
  projets: RapportProjetDTO[];
}

/** Temps d'une personne sur un projet : le pendant de TempsParPersonneDTO. */
export interface TempsParProjetDTO {
  cleProjet: string | null;
  titreProjet: string;
  heuresPassees: number;
  pourcentageDuTemps: number;
}

/** Une tâche vue depuis une personne : ses heures à elle, l'avancement de la tâche. */
export interface TachePersonneDTO {
  cle: string | null;
  nom: string;
  cleProjet: string | null;
  titreProjet: string;
  statut: StatutTache;
  statutLibelle: string;
  statutWorkflow: string | null;
  pourcentageExecution: number;
  heuresPassees: number;
  heuresPlanifiees: number;
  ecartHeures: number;
  nombreReports: number;
  /** Fausse si elle y a passé du temps sans que la tâche lui soit assignée. */
  assignee: boolean;
}

export interface RapportPersonneDTO {
  nomPersonne: string;
  username: string;
  email: string | null;
  heuresPassees: number;
  heuresPlanifiees: number;
  ecartHeures: number;
  /** Part de cette personne dans le temps total du rapport, 0-100. */
  partDuTemps: number;
  avancementMoyen: number;
  nombreProjets: number;
  nombreTaches: number;
  nombreTerminees: number;
  nombreEnCours: number;
  nombreEnRetard: number;
  nombreBloquees: number;
  nombreReportees: number;
  nombreNonDemarrees: number;
  repartitionParProjet: TempsParProjetDTO[];
  taches: TachePersonneDTO[];
}

export interface SynthesePersonnesDTO {
  nombrePersonnes: number;
  totalHeures: number;
  heuresPlanifiees: number;
  ecartHeures: number;
  nombreProjets: number;
  nombreTaches: number;
  nombreTerminees: number;
  nombreEnCours: number;
  nombreEnRetard: number;
  nombreBloquees: number;
  nombreReportees: number;
  nombreNonDemarrees: number;
  repartitionParPersonne: TempsParPersonneDTO[];
}

export interface RapportPersonnesDTO {
  departement: string | null;
  prefixeDepartement: string | null;
  genereLe: string | null;
  synthese: SynthesePersonnesDTO;
  personnes: RapportPersonneDTO[];
}

export interface RapportEquipeDTO {
  equipeId: number;
  nomEquipe: string;
  synthese: SynthesePersonnesDTO;
  personnes: RapportPersonneDTO[];
}

/**
 * Un rapport composé. Les sections non demandées valent `null` : « aucun projet
 * sélectionné » et « les projets sélectionnés n'ont rien à montrer » sont deux
 * situations différentes, l'affichage ne doit pas les confondre.
 */
export interface RapportCompositeDTO {
  titre: string;
  departement: string | null;
  prefixeDepartement: string | null;
  genereLe: string | null;
  projets: RapportProjetsDTO | null;
  personnes: RapportPersonnesDTO | null;
  equipes: RapportEquipeDTO[];
}

/** Ce que l'utilisateur demande à voir figurer dans le rapport. */
export interface DemandeRapport {
  projectId: number;
  titre?: string | null;
  projetIds: number[];
  personneIds: string[];
  equipeIds: number[];
}

/* ------------------------- Options de sélection ------------------------- */

export interface OptionProjet {
  id: number;
  cle: string | null;
  titre: string;
  statut: string | null;
  nombreTaches: number;
  creeLe: string | null;
}

export interface OptionPersonne {
  id: string;
  nom: string;
  username: string | null;
  email: string | null;
}

export interface OptionEquipe {
  id: number;
  nom: string;
  /** Membres de l'équipe : choisir une équipe, c'est d'abord choisir ses membres. */
  membreIds: string[];
}

export interface OptionsRapport {
  departement: string | null;
  prefixeDepartement: string | null;
  projets: OptionProjet[];
  personnes: OptionPersonne[];
  equipes: OptionEquipe[];
}

/** Une part du camembert, prête à être dessinée en SVG. */
export interface PartRepartition {
  nom: string;
  heures: number;
  pourcentage: number;
  couleur: string;
  /** Longueur de l'arc, sur une circonférence normalisée à 100. */
  arc: number;
  /** Décalage de départ de l'arc, même échelle. */
  decalage: number;
}

/**
 * Découpe d'un anneau de répartition, quelle que soit la nature des parts —
 * intervenants d'un projet, projets d'une personne.
 *
 * Les longueurs d'arc viennent des heures et non des pourcentages déjà
 * arrondis : trois parts à 33 % laisseraient sinon un liseré vide.
 *
 * Fonction partagée plutôt que recopiée dans chaque aperçu : deux camemberts
 * découpés différemment se remarqueraient immédiatement côte à côte dans un
 * même rapport.
 */
export function decouperRepartition(
  parts: { nom: string; heures: number; pourcentage: number }[]): PartRepartition[] {

  const total = parts.reduce((somme, part) => somme + part.heures, 0);
  if (total <= 0) {
    return [];
  }

  let cumul = 0;
  return parts.map((part, index) => {
    const arc = (part.heures / total) * 100;
    const segment: PartRepartition = {
      nom: part.nom,
      heures: part.heures,
      pourcentage: part.pourcentage,
      couleur: COULEURS_REPARTITION[index % COULEURS_REPARTITION.length],
      arc,
      // 25 place le départ à midi, le tracé se poursuivant dans le sens
      // horaire comme sur l'image du PDF.
      decalage: 25 - cumul
    };
    cumul += arc;
    return segment;
  });
}
