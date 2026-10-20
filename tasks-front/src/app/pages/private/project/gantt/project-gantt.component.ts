import {Component} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, distinctUntilChanged, filter, map, shareReplay, switchMap} from 'rxjs/operators';
import {IssueService} from '../../../../services/issue.service';
import {Project} from '../../../../type/issue';
import {EspaceDirection} from '../../direction/direction.model';
import {EspaceDirectionService} from '../../direction/espace/espace-direction.service';

/** Espace résolu ; `espace` null : l'espace de travail n'a pas d'équivalent au cockpit. */
interface Resolution {
  espace: EspaceDirection | null;
}

/**
 * Gantt des projets de l'espace de travail ouvert (`/working/TOPO/gantt`) :
 * le diagramme du cockpit de direction, qui suit ici le sélecteur d'espace de
 * travail (`IssueService.project$`) au lieu du menu de direction.
 */
@Component({
  standalone: false,
  selector: 'app-project-gantt',
  templateUrl: './project-gantt.component.html',
  styleUrls: ['./project-gantt.component.css']
})
export class ProjectGanttComponent {

  /** Un changement d'espace de travail émet une nouvelle résolution. */
  readonly resolution$: Observable<Resolution>;

  /** Source du diagramme : les espaces trouvés seulement. */
  readonly espace$: Observable<EspaceDirection>;

  constructor(issueService: IssueService, espaceService: EspaceDirectionService) {
    this.resolution$ = issueService.project$.pipe(
      filter((projet): projet is Project => !!projet?.prefix),
      distinctUntilChanged((a, b) => a.prefix === b.prefix),
      switchMap(projet => espaceService.trouver(projet.prefix as string).pipe(catchError(() => of(null)))),
      map(espace => ({espace})),
      // Le gabarit et le diagramme partagent la même résolution.
      shareReplay({bufferSize: 1, refCount: true}));
    this.espace$ = this.resolution$.pipe(
      map(resolution => resolution.espace),
      filter((espace): espace is EspaceDirection => espace != null));
  }
}
