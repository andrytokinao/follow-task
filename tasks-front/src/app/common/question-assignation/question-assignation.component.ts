import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ToastrService} from 'ngx-toastr';
import {Issue} from '../../type/issue';
import {IssueService} from '../../services/issue.service';

/**
 * « Voulez-vous vous assigner cette tâche ? », posée après chaque création de
 * tâche, où qu'elle ait lieu.
 *
 * Un seul composant pour tous les formulaires de création : la règle ne doit
 * pas dépendre de l'écran qui crée. Il s'affiche à la place du formulaire,
 * dans le même panneau — pas de popup supplémentaire.
 *
 * S'assigner ne demande aucun droit : le créateur peut toujours se prendre sa
 * tâche (voir IssueAccessService.checkCanAssignSelf). Un échec ne défait pas
 * la création, il est seulement signalé.
 */
@Component({
  standalone: false,
  selector: 'app-question-assignation',
  templateUrl: './question-assignation.component.html',
  styleUrl: './question-assignation.component.css'
})
export class QuestionAssignationComponent {

  @Input({required: true}) tache!: Issue;

  /** Émis une fois la question close : `true` si la tâche a été assignée. */
  @Output() repondu = new EventEmitter<boolean>();

  enCours = false;

  constructor(private issueService: IssueService, private toastr: ToastrService) {
  }

  repondre(oui: boolean): void {
    if (!oui) {
      this.repondu.emit(false);
      return;
    }
    this.enCours = true;
    this.issueService.assignMe(this.tache).subscribe({
      next: () => {
        this.enCours = false;
        this.toastr.success(`Tâche ${this.tache.issueKey} assignée à vous`);
        this.repondu.emit(true);
      },
      error: () => {
        this.enCours = false;
        this.toastr.warning(`Tâche ${this.tache.issueKey} créée, mais l'assignation a échoué`);
        this.repondu.emit(false);
      }
    });
  }
}
