import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription, switchMap, tap} from 'rxjs';
import {DirectionService} from '../direction.service';
import {
  AlerteDirection,
  ChargePersonne,
  ChargeSemaine,
  IndicateurCle,
  NiveauAlerte,
  ProjetPortefeuille,
  RepartitionTemps,
  SanteProjet,
  VueEnsembleDirection
} from '../direction.model';

interface InfoBulle {
  x: number;
  y: number;
  titre: string;
  lignes: string[];
}

interface SegmentRepartition {
  cle: 'missions' | 'interne' | 'commercial';
  libelle: string;
  heures: number;
  part: number;
}

/** Seuil au-delà duquel une semaine est signalée comme surcharge. */
const SEUIL_SURCHARGE = 110;

/**
 * Vue d'ensemble du cockpit : indicateurs clés, carte de charge, décisions à
 * prendre, portefeuille de projets et répartition du temps.
 *
 * Toutes les données viennent d'un seul appel agrégé, relancé à chaque
 * changement de filtre ; les graphiques sont en HTML/CSS pour rester légers
 * et lisibles sans bibliothèque.
 */
@Component({
  standalone: false,
  selector: 'app-direction-overview',
  templateUrl: './direction-overview.component.html',
  styleUrl: './direction-overview.component.css'
})
export class DirectionOverviewComponent implements OnInit, OnDestroy {

  readonly seuilSurcharge = SEUIL_SURCHARGE;

  vue: VueEnsembleDirection | null = null;
  chargement = true;
  erreur = false;
  infoBulle: InfoBulle | null = null;

  /** Légende de la carte de charge : tranches de la rampe séquentielle. */
  readonly legendeCharge = [
    {libelle: '< 50 %', classe: 'c1'},
    {libelle: '50–70', classe: 'c2'},
    {libelle: '70–85', classe: 'c3'},
    {libelle: '85–100', classe: 'c4'},
    {libelle: '> 100 %', classe: 'c5'}
  ];

  readonly seriesRepartition: { cle: SegmentRepartition['cle']; libelle: string }[] = [
    {cle: 'missions', libelle: 'Missions clients'},
    {cle: 'interne', libelle: 'Activités internes'},
    {cle: 'commercial', libelle: 'Commercial'}
  ];

  private abonnement?: Subscription;

  constructor(private directionService: DirectionService) {
  }

  ngOnInit(): void {
    this.abonnement = this.directionService.filtres$.pipe(
      tap(() => {
        this.chargement = true;
        this.erreur = false;
      }),
      switchMap(filtres => this.directionService.vueEnsemble(filtres))
    ).subscribe({
      next: vue => {
        this.vue = vue;
        this.chargement = false;
      },
      error: () => {
        this.chargement = false;
        this.erreur = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.abonnement?.unsubscribe();
  }

  // ---------------------------------------------------------------- indicateurs

  /** Sans valeur précédente, pas de tendance : une flèche inventée tromperait. */
  aTendance(ind: IndicateurCle): boolean {
    return ind.valeurPrecedente != null;
  }

  ecart(ind: IndicateurCle): number {
    return ind.valeur - (ind.valeurPrecedente ?? ind.valeur);
  }

  /** « bon », « mauvais » ou « neutre » selon le sens favorable de l'indicateur. */
  sensEcart(ind: IndicateurCle): 'bon' | 'mauvais' | 'neutre' {
    const e = this.ecart(ind);
    if (e === 0) {
      return 'neutre';
    }
    return (e > 0) === ind.hausseFavorable ? 'bon' : 'mauvais';
  }

  libelleEcart(ind: IndicateurCle): string {
    const e = this.ecart(ind);
    const signe = e > 0 ? '+' : e < 0 ? '−' : '±';
    const unite = ind.unite === '%' ? ' pts' : '';
    return `${signe}${Math.abs(e)}${unite}`;
  }

  iconeIndicateur(code: string): string {
    switch (code) {
      case 'projets':
        return 'fas fa-briefcase';
      case 'retard':
        return 'fas fa-hourglass-end';
      case 'charge':
        return 'fas fa-weight-hanging';
      default:
        return 'fas fa-bullseye';
    }
  }

  // ------------------------------------------------------------ carte de charge

  get semaines(): string[] {
    return this.vue?.charges?.[0]?.semaines.map(s => s.semaine) ?? [];
  }

  classeCharge(pourcentage: number): string {
    if (pourcentage < 50) {
      return 'c1';
    }
    if (pourcentage < 70) {
      return 'c2';
    }
    if (pourcentage < 85) {
      return 'c3';
    }
    if (pourcentage <= 100) {
      return 'c4';
    }
    return 'c5';
  }

  montrerCharge(event: MouseEvent, personne: ChargePersonne, s: ChargeSemaine): void {
    const lignes = [
      `${s.heuresPlanifiees} h planifiées sur ${s.capacite} h`,
      `Charge : ${s.pourcentage} %`
    ];
    if (s.pourcentage > SEUIL_SURCHARGE) {
      lignes.push('⚠ Surcharge');
    }
    this.placerInfoBulle(event, `${personne.nom} · ${s.semaine}`, lignes);
  }

  // ---------------------------------------------------------------- alertes

  iconeAlerte(niveau: NiveauAlerte): string {
    switch (niveau) {
      case 'CRITIQUE':
        return 'fas fa-exclamation-circle';
      case 'SERIEUX':
        return 'fas fa-exclamation-triangle';
      default:
        return 'fas fa-info-circle';
    }
  }

  libelleNiveau(niveau: NiveauAlerte): string {
    return niveau === 'CRITIQUE' ? 'Critique' : niveau === 'SERIEUX' ? 'Sérieux' : 'À noter';
  }

  trackAlerte(_: number, a: AlerteDirection): string {
    return a.titre;
  }

  // ------------------------------------------------------------- portefeuille

  /** Projets dépliés, et ceux déjà chargés une fois. */
  private readonly deplies = new Set<number>();
  private readonly dejaCharges = new Set<number>();

  basculer(p: ProjetPortefeuille): void {
    if (this.deplies.has(p.id)) {
      this.deplies.delete(p.id);
    } else {
      this.deplies.add(p.id);
      this.dejaCharges.add(p.id);
    }
  }

  estDeplie(p: ProjetPortefeuille): boolean {
    return this.deplies.has(p.id);
  }

  dejaDeplie(p: ProjetPortefeuille): boolean {
    return this.dejaCharges.has(p.id);
  }

  /** Critiques d'abord : la direction lit le tableau de haut en bas. */
  get projetsTries(): ProjetPortefeuille[] {
    const ordre: Record<SanteProjet, number> = {CRITIQUE: 0, VIGILANCE: 1, BON: 2};
    return [...(this.vue?.projets ?? [])].sort((a, b) =>
      ordre[a.sante] - ordre[b.sante] || b.tachesEnRetard - a.tachesEnRetard);
  }

  iconeSante(sante: SanteProjet): string {
    return sante === 'BON' ? 'fas fa-check-circle'
      : sante === 'VIGILANCE' ? 'fas fa-exclamation-triangle'
        : 'fas fa-times-circle';
  }

  libelleSante(sante: SanteProjet): string {
    return sante === 'BON' ? 'Dans les temps' : sante === 'VIGILANCE' ? 'À surveiller' : 'En difficulté';
  }

  consommation(p: ProjetPortefeuille): number {
    return p.heuresPrevues ? Math.round(100 * p.heuresReelles / p.heuresPrevues) : 0;
  }

  /** Le budget heures file plus vite que l'avancement : signal précoce de dépassement. */
  derive(p: ProjetPortefeuille): boolean {
    return this.consommation(p) - p.avancement > 15;
  }

  // -------------------------------------------------------------- répartition

  /** Segments non vides seulement : un segment à 0 h laisserait un trait parasite. */
  segments(r: RepartitionTemps): SegmentRepartition[] {
    const total = this.totalHeures(r) || 1;
    return this.seriesRepartition
      .filter(s => r[s.cle] > 0)
      .map(s => ({
        cle: s.cle,
        libelle: s.libelle,
        heures: r[s.cle],
        part: Math.round(100 * r[s.cle] / total)
      }));
  }

  totalHeures(r: RepartitionTemps): number {
    return r.missions + r.interne + r.commercial;
  }

  montrerSegment(event: MouseEvent, r: RepartitionTemps, s: SegmentRepartition): void {
    this.placerInfoBulle(event, `${r.departement} · ${s.libelle}`,
      [`${s.heures.toLocaleString('fr-FR')} h`, `${s.part} % du temps saisi`]);
  }

  // ---------------------------------------------------------------- info-bulle

  private placerInfoBulle(event: MouseEvent, titre: string, lignes: string[]): void {
    this.infoBulle = {x: event.clientX + 14, y: event.clientY + 14, titre, lignes};
  }

  cacherInfoBulle(): void {
    this.infoBulle = null;
  }
}
