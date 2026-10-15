import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';
import {ToastrService} from 'ngx-toastr';
import {Issue, Phase} from '../../type/issue';
import {PhaseService} from '../../services/phase.service';
import {estHorsPhaseCourante} from '../../type/choix-type-sous-tache.util';

/**
 * Phase d'une demande, dans son détail.
 *
 * Projet : sa phase en cours, lue sur son statut (lecture seule ; elle change
 * avec le statut). Tâche : la phase où elle est classée, modifiable parmi les
 * phases de son type, avec l'indication « hors phase en cours » pour une
 * correction ou un travail en avance.
 */
@Component({
  selector: 'app-phase-field',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatIconModule],
  templateUrl: './phase-field.component.html',
  styleUrls: ['./phase-field.component.css']
})
export class PhaseFieldComponent implements OnChanges {

  @Input() issue: Issue | undefined;
  /** Statut de la demande : la phase en cours d'un projet le suit, elle est relue quand il change. */
  @Input() statusId: number | null | undefined;

  detail: Issue | undefined;
  enregistrement = false;

  constructor(private phaseService: PhaseService, private toastr: ToastrService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    const autreDemande = changes['issue'] && changes['issue'].currentValue?.id !== changes['issue'].previousValue?.id;
    if (autreDemande || changes['statusId']) {
      this.charger();
    }
  }

  get estProjet(): boolean {
    return !!this.detail && !this.detail.parent?.id;
  }

  /** Phases proposées pour la tâche : celles de son type. */
  get phasesPossibles(): Phase[] {
    return this.detail?.issueType?.phases || [];
  }

  get modifiable(): boolean {
    return !this.estProjet && this.phasesPossibles.length > 1 && !this.enregistrement;
  }

  get horsPhaseCourante(): boolean {
    return estHorsPhaseCourante(this.detail?.phase, this.detail?.phaseCourante);
  }

  choisir(phase: Phase): void {
    if (!this.detail?.id || phase.id === this.detail.phase?.id) {
      return;
    }
    this.enregistrement = true;
    this.phaseService.setIssuePhase(this.detail.id, phase.id!).subscribe({
      next: maj => {
        this.enregistrement = false;
        this.detail = {...this.detail, phase: maj.phase};
      },
      error: error => {
        this.enregistrement = false;
        this.toastr.error(error?.graphQLErrors?.[0]?.message || 'Phase non modifiée');
      }
    });
  }

  private charger(): void {
    if (this.issue?.id == null) {
      this.detail = undefined;
      return;
    }
    this.phaseService.phaseDeTache(this.issue.id).subscribe({
      next: detail => this.detail = detail,
      error: () => this.detail = undefined
    });
  }
}
