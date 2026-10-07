import {Injectable} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {DocumentApp} from '../../../type/issue';
import {
  AlerteDirection,
  DetailProjet,
  FiltresDirection,
  IndicateurCle,
  ProjetPortefeuille,
  TacheProjet,
  TempsPersonne,
  VueEnsembleDirection
} from './direction.model';
import {DIRECTION_DETAIL_PROJET, DIRECTION_PROJETS, DIRECTION_TEMPS_PAR_PERSONNE} from './direction.operations';

export interface ContexteDonnees {
  departements: string[];
  miseAJour: string | null;
}

/**
 * Données du cockpit de direction et filtres partagés entre ses écrans.
 *
 * Les filtres vivent ici, et non dans chaque page : changer de département
 * dans la barre du shell doit recalculer l'écran affiché, quel qu'il soit.
 *
 * Le portefeuille vient de GraphQL (`directionProjets`) ; indicateurs et
 * alertes en sont déduits ici.
 */
@Injectable({providedIn: 'root'})
export class DirectionService {

  private readonly filtresSource = new BehaviorSubject<FiltresDirection>({
    departement: null,
    periode: 'semaine'
  });
  readonly filtres$ = this.filtresSource.asObservable();

  /**
   * Contexte de la dernière réponse, affiché par le shell : liste des
   * départements pour le filtre, heure de calcul.
   */
  private readonly contexteSource = new BehaviorSubject<ContexteDonnees>({
    departements: [], miseAJour: null
  });
  readonly contexte$ = this.contexteSource.asObservable();

  constructor(private apollo: Apollo) {
  }

  /**
   * Détail d'un projet : ses tâches (avancement, personnes, temps passé, date
   * de premier traitement), le temps de chacun par tâche, et ses livrables.
   */
  detailProjet(projetId: number): Observable<DetailProjet> {
    return this.apollo.query<any>({
      query: DIRECTION_DETAIL_PROJET,
      variables: {projetId, typeDocument: 'DONNE_FILE'},
      fetchPolicy: 'network-only'
    }).pipe(
      switchMap(res => {
        const taches: TacheProjet[] = res.data?.loadSubtask ?? [];
        const livrables: DocumentApp[] = res.data?.getDocuments ?? [];
        if (!taches.length) {
          return of({taches, livrables, tempsParTache: new Map<number, TempsPersonne[]>()});
        }
        return this.tempsParTache(taches.map(t => t.id as number)).pipe(
          map(tempsParTache => ({taches, livrables, tempsParTache})));
      }));
  }

  private tempsParTache(issueIds: number[]): Observable<Map<number, TempsPersonne[]>> {
    return this.apollo.query<any>({
      query: DIRECTION_TEMPS_PAR_PERSONNE,
      variables: {issueIds},
      fetchPolicy: 'network-only'
    }).pipe(
      map(res => {
        const parTache = new Map<number, TempsPersonne[]>();
        for (const resume of res.data?.getIssuePlanningSummaries ?? []) {
          if (resume?.issue?.id != null) {
            parTache.set(Number(resume.issue.id), resume.userStats ?? []);
          }
        }
        return parTache;
      }),
      // Sans le détail des heures, les tâches restent lisibles.
      catchError(() => of(new Map<number, TempsPersonne[]>())));
  }

  get filtres(): FiltresDirection {
    return this.filtresSource.value;
  }

  changerFiltres(changement: Partial<FiltresDirection>): void {
    this.filtresSource.next({...this.filtresSource.value, ...changement});
  }

  vueEnsemble(filtres: FiltresDirection): Observable<VueEnsembleDirection> {
    return this.charger(filtres).pipe(
      tap(vue => this.contexteSource.next({
        departements: vue.departements,
        miseAJour: vue.miseAJour
      })));
  }

  private charger(filtres: FiltresDirection): Observable<VueEnsembleDirection> {
    // La période n'est pas transmise : le portefeuille décrit l'état présent
    // des projets, pas une période.
    return this.apollo.query<any>({
      query: DIRECTION_PROJETS,
      variables: {departement: filtres.departement},
      fetchPolicy: 'network-only'
    }).pipe(
      map(res => {
        const projets: ProjetPortefeuille[] = (res.data?.directionProjets ?? []).map(versProjetPortefeuille);
        return {
          miseAJour: new Date().toISOString(),
          departements: res.data?.directionDepartements ?? [],
          indicateurs: indicateursPortefeuille(projets),
          // Pas encore mesurés : capacité des personnes et nature des
          // activités manquent. null, et non [], qui voudrait dire « rien ».
          charges: null,
          projets,
          alertes: alertesPortefeuille(projets),
          repartition: null
        };
      }));
  }
}

// ---------------------------------------------------------------------------
// Portefeuille réel (GraphQL directionProjets)
// ---------------------------------------------------------------------------

/** Écart consommation - avancement, en points, au-delà duquel un projet dérive. */
const SEUIL_DERIVE = 15;

const JOUR_MS = 86400000;

function versProjetPortefeuille(issue: any): ProjetPortefeuille {
  const rapport = issue.rapportProjet ?? {};
  const synthese = rapport.synthese ?? {};
  return {
    id: issue.id,
    prefixe: issue.issueKey,
    nom: issue.summary,
    client: null,
    departement: rapport.departement,
    prefixeDepartement: rapport.prefixeDepartement,
    chefProjet: rapport.chefDeProjet ?? null,
    sante: issue.santeProjet,
    avancement: rapport.avancementGlobal ?? 0,
    heuresPrevues: synthese.heuresPlanifiees ?? 0,
    heuresReelles: synthese.totalHeures ?? 0,
    tachesOuvertes: (synthese.nombreTaches ?? 0) - (synthese.nombreTerminees ?? 0),
    tachesEnRetard: synthese.nombreEnRetard ?? 0,
    prochaineEcheance: issue.prochaineEcheance?.finPlanifiee
      ? {libelle: issue.prochaineEcheance.summary, echeance: echeanceRelative(issue.prochaineEcheance.finPlanifiee)}
      : null
  };
}

/** « dans 3 jours », « aujourd'hui », « en retard de 4 jours ». */
function echeanceRelative(fin: string): string {
  const date = new Date(fin);
  const maintenant = new Date();
  const jours = Math.round((debutJour(date) - debutJour(maintenant)) / JOUR_MS);
  if (date.getTime() < maintenant.getTime()) {
    const retard = Math.max(1, -jours);
    return `en retard de ${retard} jour${retard > 1 ? 's' : ''}`;
  }
  if (jours === 0) {
    return 'aujourd\'hui';
  }
  return `dans ${jours} jour${jours > 1 ? 's' : ''}`;
}

function debutJour(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function consommation(p: ProjetPortefeuille): number {
  return p.heuresPrevues ? Math.round(100 * p.heuresReelles / p.heuresPrevues) : 0;
}

/** Sans historique, pas de valeur précédente : l'écran n'affiche pas de tendance. */
function indicateursPortefeuille(projets: ProjetPortefeuille[]): IndicateurCle[] {
  return [
    {code: 'projets', libelle: 'Projets actifs', valeur: projets.length, valeurPrecedente: null,
      hausseFavorable: true, aide: 'Projets avec au moins une tâche, non terminés'},
    {code: 'retard', libelle: 'Tâches en retard', valeur: projets.reduce((s, p) => s + p.tachesEnRetard, 0),
      valeurPrecedente: null, hausseFavorable: false, aide: 'Tâches commencées dont la fin planifiée est dépassée'}
  ];
}

function alertesPortefeuille(projets: ProjetPortefeuille[]): AlerteDirection[] {
  const critiques: AlerteDirection[] = projets
    .filter(p => p.sante === 'CRITIQUE')
    .map(p => ({
      niveau: 'CRITIQUE' as const,
      titre: `Projet en difficulté · ${p.prefixe}`,
      detail: `${p.tachesEnRetard} tâche${p.tachesEnRetard > 1 ? 's' : ''} en retard sur « ${p.nom} »`
        + (p.prochaineEcheance ? ` — ${p.prochaineEcheance.libelle} : ${p.prochaineEcheance.echeance}` : '') + '.'
    }));
  const derives: AlerteDirection[] = projets
    .filter(p => p.heuresPrevues > 0 && consommation(p) - p.avancement > SEUIL_DERIVE)
    .map(p => ({
      niveau: 'SERIEUX' as const,
      titre: `Budget heures consommé à ${consommation(p)} % · ${p.prefixe}`,
      detail: `Avancement de ${p.avancement} % seulement sur « ${p.nom} ».`
    }));
  return [...critiques, ...derives];
}
