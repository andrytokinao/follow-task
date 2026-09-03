/**
 * Miroir exact des records du paquet `com.kinga.followtask.dto.rapport`.
 *
 * Ces types décrivent la réponse de `GET /api/rapports/{issueId}` : l'aperçu
 * Angular est un rendu natif de ces données, et non une réutilisation du HTML
 * produit par le template Thymeleaf.
 */

export type StatutTache = 'NON_DEMARRE' | 'EN_COURS' | 'EN_RETARD' | 'TERMINE';

export interface TempsParPersonneDTO {
  nomPersonne: string;
  /** Heures décimales. */
  heuresPassees: number;
  /** Part de cette personne dans le total de la tâche, 0-100. */
  pourcentageDuTemps: number;
}

export interface TacheRapportDTO {
  nom: string;
  statut: StatutTache;
  /** Libellé prêt à afficher, calculé par le serveur. */
  statutLibelle: string;
  pourcentageExecution: number;
  tempsParPersonne: TempsParPersonneDTO[];
  totalHeuresPassees: number;
}

export interface RapportProjetDTO {
  titre: string;
  description: string | null;
  chefDeProjet: string;
  /** ISO-8601, date de création de la demande racine. */
  dateDebut: string | null;
  dateFin: string | null;
  statut: string;
  avancementGlobal: number;
  taches: TacheRapportDTO[];
}
