import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';
import {RapportService} from '../../../../../services/rapport.service';
import {IssueService} from '../../../../../services/issue.service';
import {
  COULEURS_REPARTITION,
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
export class RapportProjetComponent implements OnInit, OnDestroy {

  /** Demande racine du rapport. À défaut, elle est déduite de la route. */
  @Input() issueId?: number;

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

  /** Suivi par rang : deux tâches peuvent porter le même nom, qui ne fait donc
   *  pas une clé. */
  suiviTache(index: number, _tache: TacheRapportDTO): number {
    return index;
  }

  private charger(issueId: number): void {
    this.issueCourante = issueId;
    this.chargement = true;
    this.erreur = undefined;

    this.rapportService.obtenirRapport(issueId).subscribe({
      next: rapport => {
        this.rapport = rapport;
        this.parts = this.decouperCamembert(rapport);
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

  /**
   * Segments du camembert.
   *
   * Dessiné en SVG plutôt qu'avec une bibliothèque de graphiques : un anneau à
   * quelques parts ne justifie pas d'embarquer un moteur de rendu, et le SVG
   * reste net à tout zoom. Le PDF, lui, reçoit la même image peinte côté
   * serveur — les deux partagent la palette, pas le code.
   *
   * Les longueurs d'arc viennent des heures et non des pourcentages déjà
   * arrondis : trois parts à 33 % laisseraient sinon un liseré vide.
   */
  private decouperCamembert(rapport: RapportProjetDTO): PartRepartition[] {
    const repartition = rapport.synthese?.repartitionParPersonne ?? [];
    const total = repartition.reduce((somme, part) => somme + part.heuresPassees, 0);
    if (total <= 0) {
      return [];
    }

    let cumul = 0;
    return repartition.map((part, index) => {
      const arc = (part.heuresPassees / total) * 100;
      const segment: PartRepartition = {
        nom: part.nomPersonne,
        heures: part.heuresPassees,
        pourcentage: part.pourcentageDuTemps,
        couleur: COULEURS_REPARTITION[index % COULEURS_REPARTITION.length],
        arc,
        // 25 place le départ à midi, le tracé se poursuivant dans le sens
        // horaire comme sur l'image du PDF.
        decalage: 25 - cumul
      };
      cumul += arc;
      return segment;
    });
  }
}
