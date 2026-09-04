import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';
import {RapportService} from '../../../../../services/rapport.service';
import {IssueService} from '../../../../../services/issue.service';
import {
  decouperRepartition,
  PartRepartition,
  RapportProjetDTO,
  StatutTache,
  TacheRapportDTO
} from '../../../../../type/rapport';

/**
 * Aperçu du rapport d'avancement d'un projet.
 *
 * Rendu natif à partir du DTO JSON : le HTML produit par le template Thymeleaf
 * n'est jamais injecté ici. Les deux vues partagent la source de données, pas
 * la mise en page — le template serveur est calibré pour le PDF, celle-ci pour
 * l'écran.
 */
@Component({
  standalone: false,
  selector: 'app-rapport-projet',
  templateUrl: './rapport-projet.component.html',
  styleUrl: './rapport-projet.component.css'
})
export class RapportProjetComponent implements OnInit, OnChanges, OnDestroy {

  /** Demande racine du rapport. À défaut, elle est déduite de la route. */
  @Input() issueId?: number;

  /**
   * Rapport déjà construit, à afficher tel quel.
   *
   * Le rapport composé de l'espace de travail obtient ses projets en un seul
   * appel : les recharger un par un depuis ce composant rejouerait le calcul
   * complet de chaque projet, et un projet pourrait afficher des chiffres
   * arrêtés à un autre instant que la synthèse au-dessus de lui.
   */
  @Input() donnees?: RapportProjetDTO;

  /** Barre d'actions propre : masquée quand le document hôte porte la sienne. */
  @Input() barreActions = true;

  /**
   * Rang du projet dans le document (« 1 », « 2 »…), ou absent s'il est seul :
   * un rapport à un projet n'a rien à numéroter. Il préfixe le rang des tâches,
   * qui se lisent alors « 1.1 », « 1.2 » — de quoi désigner une tâche à l'oral
   * sans citer sa clé.
   */
  @Input() numero?: number | null;

  rapport?: RapportProjetDTO;
  chargement = false;
  erreur?: string;

  /** Parts du camembert, prêtes à dessiner. */
  parts: PartRepartition[] = [];

  /**
   * Rayon donnant une circonférence de 100 : les longueurs d'arc s'expriment
   * alors directement en pourcentage, sans conversion à chaque segment.
   */
  readonly rayon = 100 / (2 * Math.PI);

  private issueCourante?: number;
  private abonnement?: Subscription;

  constructor(private rapportService: RapportService,
              private issueService: IssueService,
              private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    if (this.donnees) {
      this.afficher(this.donnees);
      return;
    }

    if (this.issueId != null) {
      this.charger(this.issueId);
      return;
    }

    const parametre = this.route.snapshot.paramMap.get('issueId');
    if (parametre) {
      this.charger(Number(parametre));
      return;
    }

    // Onglet d'une demande racine : l'identifiant vient de la demande
    // actuellement ouverte, que le service tient à jour.
    this.abonnement = this.issueService.issueMaster$.subscribe(issue => {
      if (issue?.id != null && issue.id !== this.issueCourante) {
        this.charger(issue.id);
      }
    });
  }

  /** Le document hôte peut remplacer le rapport affiché sans détruire la vue. */
  ngOnChanges(changements: SimpleChanges): void {
    if (changements['donnees'] && !changements['donnees'].firstChange && this.donnees) {
      this.afficher(this.donnees);
    }
  }

  ngOnDestroy(): void {
    this.abonnement?.unsubscribe();
  }

  recharger(): void {
    if (this.issueCourante != null) {
      this.charger(this.issueCourante);
    }
  }

  telechargerPdf(): void {
    if (this.issueCourante != null) {
      this.rapportService.telechargerPdf(this.issueCourante);
    }
  }

  /** Seuils visuels, identiques à ceux du template serveur. */
  classeBarre(pourcentage: number): string {
    if (pourcentage < 40) {
      return 'barre-rouge';
    }
    return pourcentage < 75 ? 'barre-orange' : 'barre-verte';
  }

  classeStatut(statut: StatutTache): string {
    switch (statut) {
      case 'TERMINE':
        return 'statut-termine';
      case 'EN_RETARD':
        return 'statut-en-retard';
      case 'BLOQUE':
        return 'statut-bloque';
      case 'REPORTE':
        return 'statut-reporte';
      case 'EN_COURS':
        return 'statut-en-cours';
      default:
        return 'statut-non-demarre';
    }
  }

  /**
   * Adresse de consultation de la demande racine, ou null si le rapport ne
   * porte pas de quoi la construire. La forme de l'URL reste définie par
   * `IssueService`, seul endroit qui connaisse les routes.
   */
  lienProjet(): string | null {
    return this.issueService.buildIssueUrlFromKeys(
      this.rapport?.prefixeDepartement, this.rapport?.cle);
  }

  /** Adresse d'une tâche, qui est une sous-demande de la racine. */
  lienTache(tache: TacheRapportDTO): string | null {
    return this.issueService.buildIssueUrlFromKeys(
      this.rapport?.prefixeDepartement, tache.cle, this.rapport?.cle);
  }

  /** Suivi par rang : deux tâches peuvent porter le même nom, qui ne fait donc
   *  pas une clé. */
  suiviTache(index: number, _tache: TacheRapportDTO): number {
    return index;
  }

  /** Rang d'une tâche : « 1.1 » dans un document numéroté, « 1 » sinon. */
  numeroTache(index: number): string {
    return this.numero != null ? `${this.numero}.${index + 1}` : `${index + 1}`;
  }

  private charger(issueId: number): void {
    this.issueCourante = issueId;
    this.chargement = true;
    this.erreur = undefined;

    this.rapportService.obtenirRapport(issueId).subscribe({
      next: rapport => {
        this.afficher(rapport);
        this.chargement = false;
      },
      error: erreur => {
        // Le serveur renvoie { error: "..." } : son message dit pourquoi
        // (demande inconnue, sous-tâche sans rapport propre).
        this.erreur = erreur?.error?.error ?? "Le rapport n'a pas pu être chargé.";
        this.rapport = undefined;
        this.parts = [];
        this.chargement = false;
      }
    });
  }

  /** Affiche un rapport déjà construit, d'où qu'il vienne. */
  private afficher(rapport: RapportProjetDTO): void {
    this.rapport = rapport;
    this.parts = this.decouperCamembert(rapport);
    this.erreur = undefined;
  }

  /**
   * Segments du camembert.
   *
   * Dessiné en SVG plutôt qu'avec une bibliothèque de graphiques : un anneau à
   * quelques parts ne justifie pas d'embarquer un moteur de rendu, et le SVG
   * reste net à tout zoom. Le PDF, lui, reçoit la même image peinte côté
   * serveur — les deux partagent la palette, pas le code.
   */
  private decouperCamembert(rapport: RapportProjetDTO): PartRepartition[] {
    return decouperRepartition((rapport.synthese?.repartitionParPersonne ?? []).map(part => ({
      nom: part.nomPersonne,
      heures: part.heuresPassees,
      pourcentage: part.pourcentageDuTemps
    })));
  }
}
