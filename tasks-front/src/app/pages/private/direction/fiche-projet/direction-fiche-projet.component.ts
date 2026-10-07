import {Component, Input, OnChanges} from '@angular/core';
import {forkJoin, Observable, of, Subscription} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {CustomFieldValue, DocumentApp, Uploaded, User} from '../../../../type/issue';
import {IssueService} from '../../../../services/issue.service';
import {ProjetDirection} from '../direction.model';
/**
 * Fiche du projet choisi dans le menu : avancement global, tâches,
 * commentaires (la direction peut en ajouter), pièces livrables, champs
 * personnalisés.
 *
 * Les données viennent des requêtes existantes de `IssueService` : les
 * livrables sont des documents `DONNE_FILE`, comme dans l'espace de travail.
 */
@Component({
  standalone: false,
  selector: 'app-direction-fiche-projet',
  templateUrl: './direction-fiche-projet.component.html',
  styleUrls: ['./direction-fiche-projet.component.css']
})
export class DirectionFicheProjetComponent implements OnChanges {

  @Input({required: true}) projet!: ProjetDirection;

  livrables: DocumentApp[] = [];
  champs: CustomFieldValue[] = [];
  chargement = true;

  private abonnement?: Subscription;

  constructor(private issueService: IssueService) {
  }

  ngOnChanges(): void {
    this.abonnement?.unsubscribe();
    this.chargement = true;
    this.abonnement = forkJoin({
      livrables: sansErreur(this.issueService.getDocuments(this.projet.id, 'DONNE_FILE')),
      champs: sansErreur(this.issueService.getValues(this.projet.id))
    }).subscribe(({livrables, champs}) => {
      this.livrables = livrables;
      this.champs = champs;
      this.chargement = false;
    });
  }

  /** Adresse du projet dans son espace de travail. */
  get lien(): string[] | null {
    return this.projet.prefixeDepartement
      ? ['/working', this.projet.prefixeDepartement, 'issue', this.projet.cle]
      : null;
  }

  /** Heures passées en « 48 h 30 ». */
  get heures(): string {
    const total = Math.max(0, Math.round((this.projet.heures ?? 0) * 60));
    const h = Math.floor(total / 60);
    const m = total % 60;
    return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
  }

  nomDe(user: User | null | undefined): string {
    const nom = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    return nom || (user?.username as string) || '';
  }

  telechargement(fichier: Uploaded): string {
    return this.issueService.downloadUploadedUrl(fichier);
  }

  parId(_: number, element: { id?: unknown }): unknown {
    return element?.id;
  }
}

/** Une section en erreur reste vide, sans bloquer les autres. */
function sansErreur<T>(source: Observable<T[]>): Observable<T[]> {
  return source.pipe(catchError(() => of([] as T[])));
}
