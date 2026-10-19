/**
 * Étape d'avancement d'un statut (DT-007) : quand un créneau d'une tâche est
 * enregistré, la tâche passe au statut de son flux qui porte l'étape indiquée
 * par le planning (EN_COURS au premier pourcentage, A_VALIDER à 100 %).
 */
export type EtapeAvancement = 'A_FAIRE' | 'EN_COURS' | 'BLOQUE' | 'A_VALIDER' | 'TERMINE';

export interface DescriptionEtape {
  etape: EtapeAvancement;
  libelle: string;
  icone: string;
  aide: string;
}

export const ETAPES_AVANCEMENT: DescriptionEtape[] = [
  {etape: 'A_FAIRE', libelle: 'À faire', icone: 'fas fa-hourglass-start',
    aide: "Tâche pas encore commencée : le planning peut la faire avancer."},
  {etape: 'EN_COURS', libelle: 'En cours', icone: 'fas fa-person-digging',
    aide: "Pris dès le premier pourcentage saisi sur un créneau."},
  {etape: 'BLOQUE', libelle: 'Bloqué', icone: 'fas fa-ban',
    aide: "Pris quand le dernier créneau est bloqué ; seul un humain en sort."},
  {etape: 'A_VALIDER', libelle: 'À valider', icone: 'fas fa-clipboard-check',
    aide: "Pris à 100 %, sous-tâches achevées ; la clôture reste manuelle."},
  {etape: 'TERMINE', libelle: 'Terminé', icone: 'fas fa-flag-checkered',
    aide: "Jamais posé automatiquement."}
];

export function descriptionEtape(etape: EtapeAvancement | null | undefined): DescriptionEtape | undefined {
  return ETAPES_AVANCEMENT.find(description => description.etape === etape);
}
