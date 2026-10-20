import {CustomField, CustomFieldValue} from '../../../../../type/issue';
import {ProjetGantt, TacheGantt} from '../../direction.model';
import {jourDe} from '../gantt-dates.util';
import {FenetreGantt} from '../gantt-fenetre';

/*
 * Ce que montre le menu d'une case : chaque champ daté de la demande, coché
 * s'il tombe dans la case. Fonctions pures.
 */

/** Une case cliquée : la demande et la période qu'elle couvre. */
export interface CaseChamps {
  issueId: number;
  issueTypeId: number;
  /** Espace de travail de la demande : on y crée les nouveaux champs. */
  projectId: number | null;
  prefixe: string | null;
  /** « PRJ-12 · Maquettes ». */
  source: string;
  /** « lun. 13 oct. », « S42 · … » ou « octobre 2026 ». */
  periode: string;
  debut: number;
  fin: number;
  valeurs: CustomFieldValue[];
}

export interface LigneChamp {
  champ: CustomField;
  /** Valeurs du champ dans la case : décocher les retire. */
  ici: CustomFieldValue[];
  coche: boolean;
  /** Champ à valeur unique déjà daté hors de la case : il ne se coche pas ici. */
  bloque: boolean;
  /** Jours des valeurs hors de la case, pour le dire. */
  ailleurs: number[];
  unique: boolean;
}

/** Une seule valeur par demande ? Les champs de l'application (démarrage, deadline) le sont toujours. */
export function estValeurUnique(champ: CustomField): boolean {
  return !!champ.valeurUnique || !!champ.code;
}

/** La case de l'axe (jour, semaine ou mois) sous la position `x` d'une piste. */
export function caseDe(demande: TacheGantt, prefixe: string | null, fenetre: FenetreGantt, x: number): CaseChamps {
  const debut = fenetre.seau(fenetre.jourA(x));
  return {
    issueId: demande.id as number,
    issueTypeId: demande.issueType?.id as number,
    projectId: (demande.project?.id as number) ?? null,
    prefixe,
    source: `${demande.issueKey} · ${demande.summary}`,
    periode: fenetre.libelleCase(debut),
    debut,
    fin: fenetre.finDeCase(debut),
    valeurs: demande.values ?? []
  };
}

/**
 * Les projets, la demande `issueId` portant désormais ces valeurs. Les
 * réponses Apollo sont figées : on recopie plutôt que modifier.
 */
export function avecValeurs(projets: ProjetGantt[], issueId: number, valeurs: CustomFieldValue[]): ProjetGantt[] {
  const maj = <T extends TacheGantt>(demande: T): T => demande.id === issueId ? {...demande, values: valeurs} : demande;
  return projets.map(projet => ({...maj(projet), children: (projet.children ?? []).map(maj)}));
}

export function lignesDeCase(champs: CustomField[], cellule: CaseChamps): LigneChamp[] {
  return champs.map(champ => {
    const valeurs = cellule.valeurs.filter(v => v.customField?.id === champ.id && jourDe(v.date) !== null);
    const dansCase = (v: CustomFieldValue) => {
      const jour = jourDe(v.date)!;
      return jour >= cellule.debut && jour < cellule.fin;
    };
    const ici = valeurs.filter(dansCase);
    const ailleurs = valeurs.filter(v => !dansCase(v)).map(v => jourDe(v.date)!);
    const unique = estValeurUnique(champ);
    return {champ, ici, coche: ici.length > 0, bloque: !ici.length && unique && ailleurs.length > 0, ailleurs, unique};
  });
}
