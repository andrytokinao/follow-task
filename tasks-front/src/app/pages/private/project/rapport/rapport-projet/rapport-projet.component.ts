import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';
import {RapportService} from '../../../../../services/rapport.service';
import {IssueService} from '../../../../../services/issue.service';
import {RapportProjetDTO, StatutTache, TacheRapportDTO} from '../../../../../type/rapport';

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
        this.chargement = false;
      },
      error: erreur => {
        // Le serveur renvoie { error: "..." } : son message dit pourquoi
        // (demande inconnue, sous-tâche sans rapport propre).
        this.erreur = erreur?.error?.error ?? "Le rapport n'a pas pu être chargé.";
        this.rapport = undefined;
        this.chargement = false;
      }
    });
  }
}
