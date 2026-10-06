import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {delay, tap} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import {
  ChargePersonne,
  FiltresDirection,
  IndicateurCle,
  PeriodeDirection,
  ProjetPortefeuille,
  RepartitionTemps,
  AlerteDirection,
  VueEnsembleDirection
} from './direction.model';

export interface ContexteDonnees {
  departements: string[];
  demonstration: boolean;
  miseAJour: string | null;
}

/**
 * Données du cockpit de direction et filtres partagés entre ses écrans.
 *
 * Les filtres vivent ici, et non dans chaque page : changer de département
 * dans la barre du shell doit recalculer l'écran affiché, quel qu'il soit.
 *
 * Tant que l'endpoint d'agrégation n'existe pas côté serveur, `MODE_DEMO`
 * fournit un jeu de données réaliste (bureau d'étude en génie civil). La
 * réponse porte alors `demonstration: true` et le shell l'affiche clairement :
 * la direction ne doit jamais prendre des chiffres fictifs pour des vrais.
 */
@Injectable({providedIn: 'root'})
export class DirectionService {

  private static readonly MODE_DEMO = true;

  private readonly filtresSource = new BehaviorSubject<FiltresDirection>({
    departement: null,
    periode: 'semaine'
  });
  readonly filtres$ = this.filtresSource.asObservable();

  /**
   * Contexte de la dernière réponse, affiché par le shell : liste des
   * départements pour le filtre, origine des données, heure de calcul.
   */
  private readonly contexteSource = new BehaviorSubject<ContexteDonnees>({
    departements: [], demonstration: false, miseAJour: null
  });
  readonly contexte$ = this.contexteSource.asObservable();

  constructor(private http: HttpClient) {
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
        demonstration: vue.demonstration,
        miseAJour: vue.miseAJour
      })));
  }

  private charger(filtres: FiltresDirection): Observable<VueEnsembleDirection> {
    if (DirectionService.MODE_DEMO) {
      // Léger délai : l'état de chargement est exercé comme avec le vrai serveur.
      return of(construireDemo(filtres)).pipe(delay(350));
    }
    let params = new HttpParams().set('periode', filtres.periode);
    if (filtres.departement) {
      params = params.set('departement', filtres.departement);
    }
    return this.http.get<VueEnsembleDirection>(environment.apiURL + 'api/direction/overview', {
      params,
      withCredentials: true
    });
  }
}

// ---------------------------------------------------------------------------
// Jeu de démonstration
// ---------------------------------------------------------------------------

const DEPARTEMENTS = ['Structure', 'Hydraulique', 'VRD & Routes', 'Topographie', 'Administration'];

const PERSONNES: Array<Omit<ChargePersonne, 'semaines'> & { profil: number[] }> = [
  {id: 1, nom: 'Hery Rakoto', initiales: 'HR', poste: 'Ingénieur structure', departement: 'Structure', profil: [96, 112, 118, 104, 88, 72]},
  {id: 2, nom: 'Lova Andrianina', initiales: 'LA', poste: 'Projeteuse béton armé', departement: 'Structure', profil: [84, 90, 95, 100, 92, 80]},
  {id: 3, nom: 'Tiana Razafy', initiales: 'TR', poste: 'Dessinateur DAO', departement: 'Structure', profil: [62, 58, 70, 74, 66, 40]},
  {id: 4, nom: 'Fanja Rasoanaivo', initiales: 'FR', poste: 'Ingénieure hydraulique', departement: 'Hydraulique', profil: [102, 108, 96, 90, 86, 78]},
  {id: 5, nom: 'Mamy Randria', initiales: 'MR', poste: 'Technicien assainissement', departement: 'Hydraulique', profil: [44, 50, 38, 56, 60, 52]},
  {id: 6, nom: 'Njaka Rabe', initiales: 'NR', poste: 'Chef de projet routes', departement: 'VRD & Routes', profil: [118, 126, 114, 108, 98, 94]},
  {id: 7, nom: 'Sitraka Ravelo', initiales: 'SR', poste: 'Ingénieur VRD', departement: 'VRD & Routes', profil: [88, 92, 86, 94, 90, 84]},
  {id: 8, nom: 'Voahirana Rajao', initiales: 'VR', poste: 'Géomètre topographe', departement: 'Topographie', profil: [76, 82, 100, 106, 70, 64]},
  {id: 9, nom: 'Andry Rasolo', initiales: 'AR', poste: 'Opérateur drone', departement: 'Topographie', profil: [30, 46, 52, 40, 36, 28]},
  {id: 10, nom: 'Mialy Ranaivo', initiales: 'MR', poste: 'Chargée d\'affaires', departement: 'Administration', profil: [80, 86, 78, 82, 90, 76]}
];

const PROJETS: ProjetPortefeuille[] = [
  {id: 1, prefixe: 'PNT', nom: 'Pont de la Betsiboka — étude d\'exécution', client: 'Ministère des Travaux Publics', departement: 'Structure', chefProjet: 'Hery Rakoto', sante: 'CRITIQUE', avancement: 54, heuresPrevues: 1200, heuresReelles: 1010, tachesOuvertes: 38, tachesEnRetard: 7, prochainLivrable: {libelle: 'Note de calcul tablier', echeance: 'dans 3 jours'}},
  {id: 2, prefixe: 'IMM', nom: 'Immeuble R+8 Ankorondrano', client: 'Groupe Immobilier Océan', departement: 'Structure', chefProjet: 'Lova Andrianina', sante: 'BON', avancement: 72, heuresPrevues: 860, heuresReelles: 590, tachesOuvertes: 21, tachesEnRetard: 0, prochainLivrable: {libelle: 'Plans de ferraillage niv. 5–8', echeance: 'dans 9 jours'}},
  {id: 3, prefixe: 'AEP', nom: 'Adduction d\'eau potable Moramanga', client: 'JIRAMA', departement: 'Hydraulique', chefProjet: 'Fanja Rasoanaivo', sante: 'VIGILANCE', avancement: 41, heuresPrevues: 740, heuresReelles: 420, tachesOuvertes: 29, tachesEnRetard: 3, prochainLivrable: {libelle: 'APD réseau de distribution', echeance: 'dans 6 jours'}},
  {id: 4, prefixe: 'RN7', nom: 'Réhabilitation RN7 — lot 2', client: 'Agence Routière', departement: 'VRD & Routes', chefProjet: 'Njaka Rabe', sante: 'VIGILANCE', avancement: 63, heuresPrevues: 1500, heuresReelles: 1080, tachesOuvertes: 44, tachesEnRetard: 4, prochainLivrable: {libelle: 'Dossier d\'appel d\'offres', echeance: 'dans 12 jours'}},
  {id: 5, prefixe: 'LOT', nom: 'Lotissement Ivato — VRD', client: 'Promotion Ivato SA', departement: 'VRD & Routes', chefProjet: 'Sitraka Ravelo', sante: 'BON', avancement: 86, heuresPrevues: 420, heuresReelles: 352, tachesOuvertes: 6, tachesEnRetard: 0, prochainLivrable: {libelle: 'Plans de récolement', echeance: 'dans 15 jours'}},
  {id: 6, prefixe: 'TOP', nom: 'Levé topographique zone portuaire', client: 'Port de Toamasina', departement: 'Topographie', chefProjet: 'Voahirana Rajao', sante: 'BON', avancement: 38, heuresPrevues: 310, heuresReelles: 112, tachesOuvertes: 12, tachesEnRetard: 0, prochainLivrable: {libelle: 'Modèle numérique de terrain', echeance: 'dans 20 jours'}},
  {id: 7, prefixe: 'BAR', nom: 'Barrage collinaire Itasy', client: 'Région Itasy', departement: 'Hydraulique', chefProjet: 'Fanja Rasoanaivo', sante: 'CRITIQUE', avancement: 22, heuresPrevues: 980, heuresReelles: 360, tachesOuvertes: 33, tachesEnRetard: 5, prochainLivrable: {libelle: 'Étude géotechnique', echeance: 'en retard de 4 jours'}}
];

const REPARTITION_HEBDO: RepartitionTemps[] = [
  {departement: 'Structure', missions: 98, interne: 12, commercial: 4},
  {departement: 'Hydraulique', missions: 58, interne: 14, commercial: 6},
  {departement: 'VRD & Routes', missions: 72, interne: 6, commercial: 3},
  {departement: 'Topographie', missions: 44, interne: 18, commercial: 2},
  {departement: 'Administration', missions: 6, interne: 22, commercial: 12}
];

const MULTIPLICATEUR: Record<PeriodeDirection, number> = {semaine: 1, mois: 4.3, trimestre: 13};

function construireDemo(filtres: FiltresDirection): VueEnsembleDirection {
  const dansPerimetre = (dep: string) => !filtres.departement || dep === filtres.departement;
  const semaines = prochainesSemaines(6);

  const charges: ChargePersonne[] = PERSONNES
    .filter(p => dansPerimetre(p.departement))
    .map(({profil, ...p}) => ({
      ...p,
      semaines: profil.map((pourcentage, i) => ({
        semaine: semaines[i],
        pourcentage,
        capacite: 40,
        heuresPlanifiees: Math.round(pourcentage * 0.4)
      }))
    }));

  const projets = PROJETS.filter(p => dansPerimetre(p.departement));
  const repartition = REPARTITION_HEBDO
    .filter(r => dansPerimetre(r.departement))
    .map(r => {
      const k = MULTIPLICATEUR[filtres.periode];
      return {
        departement: r.departement,
        missions: Math.round(r.missions * k),
        interne: Math.round(r.interne * k),
        commercial: Math.round(r.commercial * k)
      };
    });

  return {
    demonstration: true,
    miseAJour: new Date().toISOString(),
    departements: DEPARTEMENTS,
    indicateurs: indicateurs(charges, projets, repartition),
    charges,
    projets,
    alertes: alertes(charges, projets),
    repartition
  };
}

function indicateurs(charges: ChargePersonne[], projets: ProjetPortefeuille[],
                     repartition: RepartitionTemps[]): IndicateurCle[] {
  const chargeCourante = charges.length
    ? Math.round(charges.reduce((s, c) => s + c.semaines[0].pourcentage, 0) / charges.length)
    : 0;
  const total = repartition.reduce((s, r) => s + r.missions + r.interne + r.commercial, 0);
  const productif = total ? Math.round(100 * repartition.reduce((s, r) => s + r.missions, 0) / total) : 0;
  const enRetard = projets.reduce((s, p) => s + p.tachesEnRetard, 0);

  return [
    {code: 'projets', libelle: 'Projets actifs', valeur: projets.length, valeurPrecedente: Math.max(projets.length - 1, 0),
      hausseFavorable: true, aide: 'Projets avec au moins une tâche ouverte'},
    {code: 'retard', libelle: 'Tâches en retard', valeur: enRetard, valeurPrecedente: Math.round(enRetard * 0.75),
      hausseFavorable: false, aide: 'Tâches dont l\'échéance est dépassée'},
    {code: 'charge', libelle: 'Charge de l\'équipe', valeur: chargeCourante, unite: '%', valeurPrecedente: chargeCourante - 4,
      hausseFavorable: false, aide: 'Heures planifiées cette semaine ÷ capacité'},
    {code: 'productif', libelle: 'Temps sur missions', valeur: productif, unite: '%', valeurPrecedente: productif - 3,
      hausseFavorable: true, aide: 'Part du temps saisi consacrée aux missions clients'}
  ];
}

function alertes(charges: ChargePersonne[], projets: ProjetPortefeuille[]): AlerteDirection[] {
  const resultat: AlerteDirection[] = [];

  const surcharges = charges.filter(c => c.semaines.slice(0, 2).some(s => s.pourcentage > 110));
  if (surcharges.length) {
    resultat.push({
      niveau: 'CRITIQUE',
      titre: `${surcharges.length} personne${surcharges.length > 1 ? 's' : ''} au-delà de 110 %`,
      detail: surcharges.map(c => c.nom).join(', ') + ' — envisager une réaffectation.'
    });
  }
  projets.filter(p => p.prochainLivrable?.echeance.startsWith('en retard')).forEach(p => resultat.push({
    niveau: 'CRITIQUE',
    titre: `Livrable en retard · ${p.prefixe}`,
    detail: `${p.prochainLivrable!.libelle} — ${p.prochainLivrable!.echeance}.`
  }));
  projets.filter(p => p.heuresReelles > p.heuresPrevues * 0.8 && p.avancement < 60).forEach(p => resultat.push({
    niveau: 'SERIEUX',
    titre: `Budget heures consommé à ${Math.round(100 * p.heuresReelles / p.heuresPrevues)} % · ${p.prefixe}`,
    detail: `Avancement de ${p.avancement} % seulement sur « ${p.nom} ».`
  }));
  const disponibles = charges.filter(c => c.semaines[0].pourcentage < 60);
  if (disponibles.length) {
    resultat.push({
      niveau: 'VIGILANCE',
      titre: `${disponibles.length} personne${disponibles.length > 1 ? 's' : ''} disponible${disponibles.length > 1 ? 's' : ''} cette semaine`,
      detail: disponibles.map(c => c.nom).join(', ') + ' — capacité pour renforcer un projet.'
    });
  }
  return resultat;
}

/** Libellés « S41 », « S42 »… à partir de la semaine ISO courante. */
function prochainesSemaines(nombre: number): string[] {
  const libelles: string[] = [];
  const jour = new Date();
  for (let i = 0; i < nombre; i++) {
    libelles.push('S' + numeroSemaineIso(new Date(jour.getTime() + i * 7 * 86400000)));
  }
  return libelles;
}

function numeroSemaineIso(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const jourSemaine = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - jourSemaine);
  const debutAnnee = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - debutAnnee.getTime()) / 86400000 + 1) / 7);
}
