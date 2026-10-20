import {CustomFieldValue} from '../../../../type/issue';
import {issueAssignees} from '../../../../type/issue-grouping.util';
import {ProjetGantt, TacheGantt} from '../direction.model';
import {instantDe, JOUR, jourDe, plusJours} from './gantt-dates.util';
import {FenetreGantt} from './gantt-fenetre';
import {BlocGantt, CadreGantt, ChampGantt, LigneGantt, RepereGantt} from './gantt-projets.model';
import {Regroupement} from './gantt-regroupement';

/*
 * Couche « structure » du Gantt de direction : des projets vers leurs blocs —
 * tâches, cadres, retards et champs datés. Elle ignore les événements de
 * planning (voir `gantt-evenements.ts`) : choisir une personne ne la touche pas.
 *
 * Fonctions pures — la page les appelle quand ses entrées changent, jamais
 * depuis le gabarit.
 */

/**
 * Couleurs des champs personnalisés, attribuées dans cet ordre fixe, au
 * premier champ rencontré. Palette catégorielle vérifiée pour les daltoniens ;
 * le rouge n'y est pas : il est réservé au retard. Au-delà, gris.
 */
const COULEURS_CHAMPS = ['#eb6834', '#4a3aa7', '#1baf7a', '#eda100', '#e87ba4', '#008300'];
const COULEUR_AUTRE = '#898781';

const TYPE_DATE = 'Date';

export interface EntreesStructure {
  projets: ProjetGantt[];
  fenetre: FenetreGantt;
  maintenant: number;
  champs: ChampGantt[];
  /** Ce que liste chaque projet : ses tâches, ou des groupes de tâches. */
  regroupement: Regroupement;
}

/**
 * Une couleur par champ personnalisé de type Date, dans l'ordre où les projets
 * les présentent. Les champs `connus` gardent la leur : une date posée ne
 * repeint pas les autres.
 */
export function indexerChamps(projets: ProjetGantt[], connus: ChampGantt[] = []): ChampGantt[] {
  const champs = new Map<number, ChampGantt>(connus.map(c => [c.id, c]));
  for (const demande of projets.flatMap(projet => [projet, ...(projet.children ?? [])])) {
    for (const valeur of (demande.values ?? []).filter(estRepere)) {
      const id = valeur.customField.id as number;
      if (!champs.has(id)) {
        champs.set(id, {
          id,
          nom: String(valeur.customField.name ?? ''),
          couleur: COULEURS_CHAMPS[champs.size] ?? COULEUR_AUTRE
        });
      }
    }
  }
  return [...champs.values()];
}

/**
 * Projets dans l'ordre de leur première tâche commencée ou prévue ; ceux dont
 * aucune tâche n'a de date, puis ceux sans tâche, en bas.
 */
export function construireBlocs(entrees: EntreesStructure): BlocGantt[] {
  return entrees.projets
    .map(projet => bloc(projet, entrees))
    .sort((a, b) => rangProjet(a) - rangProjet(b)
      || (debutDe(a) ?? Infinity) - (debutDe(b) ?? Infinity));
}

/**
 * Les valeurs d'une seule demande ont changé (`projets` les porte déjà) : on
 * ne refait que ses repères, sur sa ligne ou sur l'en-tête de son projet.
 * Les autres blocs et lignes gardent leurs objets : l'affichage ne bouge
 * qu'à cet endroit.
 */
export function rafraichirDemande(blocs: BlocGantt[], issueId: number, entrees: EntreesStructure): BlocGantt[] {
  return blocs.map(b => {
    const projet = entrees.projets.find(p => p.id === b.projet.id);
    if (!projet || projet === b.projet) {
      return b;
    }
    const taches = new Map((projet.children ?? []).map(t => [t.id, t]));
    return {
      ...b,
      projet,
      reperes: projet.id === issueId ? reperes(projet, entrees) : b.reperes,
      lignes: b.lignes.map(l => {
        if (!l.taches.some(t => t.id === issueId)) {
          return l;
        }
        const nouvelles = l.taches.map(t => taches.get(t.id) ?? t);
        return {...l, taches: nouvelles, tache: l.tache ? nouvelles[0] : null, reperes: nouvelles.flatMap(t => reperes(t, entrees))};
      })
    };
  });
}

/** 0 : des tâches datées ; 1 : des tâches sans date ; 2 : aucune tâche. */
function rangProjet(bloc: BlocGantt): number {
  if (!bloc.lignes.length) {
    return 2;
  }
  return debutDe(bloc) === null ? 1 : 0;
}

/** Début de la première ligne : les lignes sont déjà rangées. */
function debutDe(bloc: BlocGantt): number | null {
  return bloc.lignes[0]?.debut ?? null;
}

/**
 * Dans l'ordre d'exécution : le diagramme se lit en escalier. À début égal, la
 * deadline la plus proche d'abord ; sans date, en bas.
 */
export function parDebut(a: LigneGantt, b: LigneGantt): number {
  return (a.debut ?? Infinity) - (b.debut ?? Infinity)
    || (a.cadre?.fin ?? Infinity) - (b.cadre?.fin ?? Infinity);
}

// ------------------------------------------------------------------ projet

function bloc(projet: ProjetGantt, entrees: EntreesStructure): BlocGantt {
  const taches = projet.children ?? [];
  const lignes = regrouper(taches.map(tache => ligne(tache, projet, entrees)), entrees).sort(parDebut);
  const avancement = borner(projet.rapportProjet?.avancementGlobal ?? projet.currentCompletionPercent ?? 0);
  // Sans dates sur le projet, son cadre est celui qui englobe ses tâches.
  const cadres = lignes.map(l => l.cadre).filter((c): c is CadreGantt => c !== null);
  const cadreProjet = cadre(projet, entrees.fenetre) ?? (cadres.length ? englobant(cadres, entrees.fenetre) : null);

  return {
    projet,
    avancement,
    nombreTaches: projet.rapportProjet?.synthese?.nombreTaches ?? taches.length,
    enRetard: projet.rapportProjet?.synthese?.nombreEnRetard ?? 0,
    cadre: cadreProjet,
    rempli: cadreProjet && avancement > 0
      ? entrees.fenetre.segment(cadreProjet.debut, cadreProjet.debut + (cadreProjet.fin - cadreProjet.debut) * avancement / 100)
      : null,
    reperes: reperes(projet, entrees),
    lignes
  };
}

/** Le cadre qui englobe plusieurs cadres : du premier démarrage à la dernière deadline. */
function englobant(cadres: CadreGantt[], fenetre: FenetreGantt): CadreGantt {
  const debut = Math.min(...cadres.map(c => c.debut));
  const fin = Math.max(...cadres.map(c => c.fin));
  return {debut, fin, sansEcheance: cadres.every(c => c.sansEcheance), segment: fenetre.segment(debut, fin)};
}

// ------------------------------------------------------------------ tâche

/** La ligne d'une tâche seule ; sa clé est déjà celle de son groupe dans le projet. */
function ligne(tache: TacheGantt, projet: ProjetGantt, entrees: EntreesStructure): LigneGantt {
  const avancement = borner(tache.currentCompletionPercent ?? 0);
  const cadreTache = cadre(tache, entrees.fenetre);
  const groupe = entrees.regroupement.groupeDe(tache);
  return {
    // Deux projets peuvent avoir le même groupe (un même type) : la clé porte le projet.
    cle: `${projet.id}/${groupe.cle}`,
    nom: groupe.nom,
    taches: [tache],
    tache,
    avancement,
    responsable: issueAssignees(tache)[0] ?? null,
    cadre: cadreTache,
    debut: instantDe(tache.debutExecution) ?? cadreTache?.debut ?? null,
    retard: retard(cadreTache, avancement, entrees),
    reperes: reperes(tache, entrees)
  };
}

/**
 * Une ligne par groupe. Par tâche, chaque ligne est déjà son propre groupe ;
 * sinon les lignes d'un même groupe sont fondues en une seule, qui les résume.
 */
function regrouper(lignes: LigneGantt[], entrees: EntreesStructure): LigneGantt[] {
  if (entrees.regroupement.parTache) {
    return lignes;
  }
  const groupes = new Map<string, LigneGantt[]>();
  for (const l of lignes) {
    groupes.set(l.cle, [...(groupes.get(l.cle) ?? []), l]);
  }
  return [...groupes.values()].map(groupe => fondre(groupe, entrees.fenetre));
}

/** Résumé d'un groupe : l'étendue de ses tâches, leur avancement moyen, leur plus long retard. */
function fondre(lignes: LigneGantt[], fenetre: FenetreGantt): LigneGantt {
  const cadres = lignes.map(l => l.cadre).filter((c): c is CadreGantt => c !== null);
  const retards = lignes.map(l => l.retard).filter((r): r is NonNullable<LigneGantt['retard']> => r !== null);
  const debuts = lignes.map(l => l.debut).filter((d): d is number => d !== null);
  return {
    cle: lignes[0].cle,
    nom: lignes[0].nom,
    taches: lignes.flatMap(l => l.taches),
    tache: null,
    avancement: borner(lignes.reduce((somme, l) => somme + l.avancement, 0) / lignes.length),
    responsable: null,
    cadre: cadres.length ? englobant(cadres, fenetre) : null,
    debut: debuts.length ? Math.min(...debuts) : null,
    retard: retards.length ? retards.reduce((pire, r) => r.jours > pire.jours ? r : pire) : null,
    reperes: lignes.flatMap(l => l.reperes)
  };
}

/**
 * Le cadre : démarrage → deadline. Une seule des deux dates saisie donne un
 * cadre d'un jour, à sa place ; aucune, pas de cadre.
 */
function cadre(demande: TacheGantt, fenetre: FenetreGantt): CadreGantt | null {
  const echeance = jourDe(demande.deadline);
  const debut = jourDe(demande.dateDemarrage) ?? echeance;
  if (debut === null) {
    return null;
  }
  const fin = Math.max(plusJours(debut, 1), echeance === null ? 0 : plusJours(echeance, 1));
  return {debut, fin, sansEcheance: echeance === null, segment: fenetre.segment(debut, fin)};
}

/** Retard d'une tâche non finie : de sa deadline à aujourd'hui. */
function retard(cadreTache: CadreGantt | null, avancement: number, entrees: EntreesStructure): LigneGantt['retard'] {
  if (!cadreTache || cadreTache.sansEcheance || avancement >= 100 || entrees.maintenant <= cadreTache.fin) {
    return null;
  }
  const segment = entrees.fenetre.segment(cadreTache.fin, entrees.maintenant);
  return segment ? {...segment, jours: Math.ceil((entrees.maintenant - cadreTache.fin) / JOUR)} : null;
}

// ------------------------------------------------------------------ champs

/**
 * Valeur datée d'un champ de type Date. Démarrage et deadline en sont : ils
 * bornent déjà le cadre, leur barre dit de quelle date il s'agit au survol.
 */
function estRepere(valeur: CustomFieldValue): boolean {
  const champ = valeur?.customField;
  return !!champ && champ.type === TYPE_DATE && !!valeur.date;
}

/** Clé de la barre d'un champ daté sur une demande, à un jour. */
export function cleRepere(issueId: number, champId: number, jour: number): string {
  return `${issueId}/${champId}/${jour}`;
}

/** Champs personnalisés de type Date d'une demande qui tombent dans la fenêtre. */
function reperes(demande: TacheGantt, entrees: EntreesStructure): RepereGantt[] {
  const resultat: RepereGantt[] = [];
  for (const valeur of (demande.values ?? []).filter(estRepere)) {
    const jour = jourDe(valeur.date);
    if (jour === null || !entrees.fenetre.contient(jour)) {
      continue;
    }
    resultat.push({
      cle: cleRepere(demande.id as number, valeur.customField.id as number, jour),
      // Milieu du jour : la barre ne se confond pas avec un bord de cadre.
      gauche: entrees.fenetre.x(jour + JOUR / 2),
      source: `${demande.issueKey} · ${demande.summary}`,
      nom: String(valeur.customField.name ?? ''),
      couleur: entrees.champs.find(c => c.id === valeur.customField.id)?.couleur ?? COULEUR_AUTRE,
      date: jour
    });
  }
  return resultat;
}

function borner(pourcentage: number): number {
  return Math.max(0, Math.min(100, Math.round(pourcentage)));
}
