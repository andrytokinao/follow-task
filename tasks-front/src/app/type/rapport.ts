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
