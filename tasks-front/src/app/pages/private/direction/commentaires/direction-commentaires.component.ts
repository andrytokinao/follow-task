import {Component, Input, OnChanges} from '@angular/core';
import {Subscription} from 'rxjs';
import {filter, switchMap, take} from 'rxjs/operators';
import {DocumentApp, Uploaded, User} from '../../../../type/issue';
import {IssueService} from '../../../../services/issue.service';
import {UserService} from '../../../../services/user.service';
import {AuthService} from '../../../../services/auth.service';

/**
 * Commentaires d'un projet ou d'une tâche : la liste, et un champ pour en
 * ajouter un.
 *
 * Mêmes données que l'espace de travail : un commentaire est un document
 * `COMMENT_FILES` rattaché à la demande, enregistré par `addDocument`. Un
 * commentaire écrit ici apparaît donc aussi dans l'espace, et inversement.
 */
@Component({
  standalone: false,
  selector: 'app-direction-commentaires',
  templateUrl: './direction-commentaires.component.html',
  styleUrls: ['./direction-commentaires.component.css']
})
export class DirectionCommentairesComponent implements OnChanges {

  @Input({required: true}) issueId!: number;

  commentaires: DocumentApp[] = [];
  chargement = true;
  texte = '';
  envoi = false;
  erreurEnvoi = false;

  private abonnement?: Subscription;

  constructor(private issueService: IssueService,
              private userService: UserService,
              private authService: AuthService) {
  }

  ngOnChanges(): void {
    this.texte = '';
    this.charger();
  }

  commenter(): void {
    const texte = this.texte.trim();
    if (!texte || this.envoi) {
      return;
    }
    this.envoi = true;
    this.erreurEnvoi = false;
    this.authService.getProfile().pipe(
      filter(profil => !!profil?.id),
      take(1),
      switchMap(profil => this.issueService.saveDocument({
        typeDocument: 'COMMENT_FILES',
        titre: 'Commentaire',
        description: versHtml(texte),
        issues: {id: this.issueId},
        userApp: {id: profil.id}
      }))
    ).subscribe({
      next: () => {
        this.envoi = false;
        this.texte = '';
        this.charger();
      },
      error: () => {
        this.envoi = false;
        this.erreurEnvoi = true;
      }
    });
  }

  nomDe(user: User | null | undefined): string {
    const nom = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    return nom || (user?.username as string) || '';
  }

  photoDe(user: User | undefined): string {
    return user ? this.userService.getUrlPhoto(user) : '';
  }

  telechargement(fichier: Uploaded): string {
    return this.issueService.downloadUploadedUrl(fichier);
  }

  parId(_: number, element: { id?: unknown }): unknown {
    return element?.id;
  }

  private charger(): void {
    this.abonnement?.unsubscribe();
    this.chargement = true;
    this.abonnement = this.issueService.getDocuments(this.issueId, 'COMMENT_FILES').subscribe({
      next: commentaires => {
        this.commentaires = commentaires ?? [];
        this.chargement = false;
      },
      error: () => {
        this.commentaires = [];
        this.chargement = false;
      }
    });
  }
}

/**
 * Les commentaires de l'espace sont saisis en HTML (éditeur riche) et affichés
 * tels quels : le texte simple saisi ici est échappé, ses retours à la ligne
 * gardés.
 */
function versHtml(texte: string): string {
  const echappe = texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<p>${echappe.replace(/\n/g, '<br>')}</p>`;
}
