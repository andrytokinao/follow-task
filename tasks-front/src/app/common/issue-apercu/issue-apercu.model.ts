import {Issue, IssueType, Status, User} from "../../type/issue";
import {issueAssignees, userDisplayName} from "../../type/issue-grouping.util";
import {duree} from "../../pages/private/direction/situation/situation.model";

/** Ce que la popup reçoit : l'issue à afficher, entière ou par son seul identifiant. */
export interface IssueApercuData {
  issueId: number;
}

/** Une personne telle que l'aperçu l'affiche. */
export interface PersonneApercu {
  nom: string;
  photo: string | null;
}

/** Une ligne de la liste des sous-tâches. */
export interface SousTacheApercu {
  issue: Issue;
  cle: string;
  titre: string;
  type: IssueType | null;
  statut: Status | null;
  avancement: number;
  assignes: PersonneApercu[];
  terminee: boolean;
}

/**
 * Vue calculée une fois au chargement : le gabarit ne lit que des champs, pour
 * ne pas recalculer listes et totaux à chaque détection de changements.
 */
export interface IssueApercu {
  issue: Issue;
  cle: string;
  titre: string;
  estSousTache: boolean;
  typeLibelle: string;
  type: IssueType | null;
  statut: Status | null;
  description: string;
  projet: string;
  parent: Issue | null;
  rapporteur: PersonneApercu | null;
  assignes: PersonneApercu[];
  etiquettes: { nom: string; couleur: string }[];
  creation: string | null;
  demarrage: string | null;
  echeance: string | null;
  enRetard: boolean;
  avancement: number;
  tempsPasse: string | null;
  sousTaches: SousTacheApercu[];
  sousTachesTerminees: number;
  /** Sous-tâches pas encore reçues : l'issue s'affiche sans les attendre. */
  sousTachesEnCours: boolean;
}

const CODE_DEMARRAGE = 'DATE_DEMARRAGE';
const CODE_ECHEANCE = 'DEADLINE';

/**
 * Construit la vue de la popup. photoDe vient du UserService : null quand
 * l'utilisateur n'a pas de photo, pour qu'app-avatar affiche ses initiales.
 * sousTaches null : pas encore reçues.
 */
export function construireApercu(issue: Issue,
                                 sousTaches: Issue[] | null,
                                 photoDe: (user: User) => string | null): IssueApercu {
  const personne = (user: User): PersonneApercu => ({nom: userDisplayName(user), photo: photoDe(user)});
  const lignes = (sousTaches ?? []).map(sousTache => construireSousTache(sousTache, personne));
  const echeance = dateDuChamp(issue, CODE_ECHEANCE);
  const avancement = pourcentage(issue.currentCompletionPercent);

  return {
    issue,
    cle: String(issue.issueKey ?? ''),
    titre: String(issue.summary ?? ''),
    estSousTache: issue.parent != null,
    typeLibelle: String(issue.issueType?.name ?? ''),
    type: issue.issueType ?? null,
    statut: issue.status ?? null,
    description: String(issue.description ?? '').trim(),
    projet: String(issue.project?.name ?? ''),
    parent: issue.parent ?? null,
    rapporteur: issue.reporter ? personne(issue.reporter) : null,
    assignes: issueAssignees(issue).map(personne),
    etiquettes: (issue.labels || [])
      .filter(lien => lien.label)
      .map(lien => ({nom: String(lien.label.name ?? ''), couleur: String(lien.label.color || '#6b7280')})),
    creation: issue.creationDate ? String(issue.creationDate) : null,
    demarrage: dateDuChamp(issue, CODE_DEMARRAGE),
    echeance,
    enRetard: echeance != null && avancement < 100 && new Date(echeance) < debutDuJour(),
    avancement,
    tempsPasse: issue.elapsedDurationMinutes ? duree(issue.elapsedDurationMinutes) : null,
    sousTaches: lignes,
    sousTachesTerminees: lignes.filter(ligne => ligne.terminee).length,
    sousTachesEnCours: sousTaches === null,
  };
}

function construireSousTache(issue: Issue, personne: (user: User) => PersonneApercu): SousTacheApercu {
  const avancement = pourcentage(issue.currentCompletionPercent);
  return {
    issue,
    cle: String(issue.issueKey ?? ''),
    titre: String(issue.summary ?? ''),
    type: issue.issueType ?? null,
    statut: issue.status ?? null,
    avancement,
    assignes: issueAssignees(issue).map(personne),
    // Le statut fait foi quand son étape est connue (DT-007), sinon le pourcentage.
    terminee: (issue.status as any)?.etapeAvancement === 'TERMINE' || avancement >= 100,
  };
}

function dateDuChamp(issue: Issue, code: string): string | null {
  const valeur = (issue.values || []).find(v => v.customField?.code === code && v.date);
  return valeur?.date ?? null;
}

function pourcentage(valeur: number | null | undefined): number {
  return Math.min(100, Math.max(0, Math.round(valeur ?? 0)));
}

function debutDuJour(): Date {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  return aujourdhui;
}
