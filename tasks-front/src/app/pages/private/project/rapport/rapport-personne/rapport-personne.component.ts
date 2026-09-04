import {Component, Input, OnChanges} from '@angular/core';
import {IssueService} from '../../../../../services/issue.service';
import {
  decouperRepartition,
  PartRepartition,
  RapportPersonneDTO,
  StatutTache,
  TachePersonneDTO
} from '../../../../../type/rapport';

/**
 * Aperçu de l'activité d'une personne.
 *
 * Pendant de `RapportProjetComponent`, vu de l'autre bout : on ne demande plus
 * « où en est ce projet » mais « qu'a fait cette personne, et sur quoi ». Les
 * heures affichées sont les siennes ; l'avancement et le statut sont ceux de la
 * tâche entière, qui est menée à plusieurs.
 *
 * Le composant ne charge rien : les personnes d'un rapport arrivent ensemble
 * dans un seul appel, et doivent afficher des chiffres arrêtés au même instant
 * que la synthèse qui les surplombe.
 */
@Component({
  standalone: false,
  selector: 'app-rapport-personne',
  templateUrl: './rapport-personne.component.html',
  styleUrl: './rapport-personne.component.css'
})
export class RapportPersonneComponent implements OnChanges {

  @Input({required: true}) personne!: RapportPersonneDTO;

  /**
   * Préfixe de l'espace de travail, nécessaire pour bâtir l'adresse d'une
   * demande. Le rapport d'une personne porte des tâches de plusieurs projets,
   * mais tous du même espace de travail : le préfixe vient donc du document.
   */
  @Input() prefixe?: string | null;

  parts: PartRepartition[] = [];

  /** Rayon donnant une circonférence de 100 : les arcs s'expriment en pourcentage. */
  readonly rayon = 100 / (2 * Math.PI);

  constructor(private issueService: IssueService) {
  }

  ngOnChanges(): void {
    this.parts = decouperRepartition((this.personne?.repartitionParProjet ?? []).map(part => ({
      nom: part.titreProjet || part.cleProjet || 'Projet sans titre',
      heures: part.heuresPassees,
      pourcentage: part.pourcentageDuTemps
    })));
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
   * Adresse d'une tâche. Une demande racine n'a pas de parent : son adresse est
   * celle d'une demande, pas d'une sous-demande.
   */
  lienTache(tache: TachePersonneDTO): string | null {
    const parent = !tache.cleProjet || tache.cleProjet === tache.cle ? null : tache.cleProjet;
    return this.issueService.buildIssueUrlFromKeys(this.prefixe, tache.cle, parent);
  }

  /** Suivi par rang : deux tâches peuvent porter le même nom, qui ne fait pas une clé. */
  suiviTache(index: number, _tache: TachePersonneDTO): number {
    return index;
  }
}
