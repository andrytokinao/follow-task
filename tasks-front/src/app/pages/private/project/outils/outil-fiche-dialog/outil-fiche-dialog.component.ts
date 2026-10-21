import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ToastrService} from 'ngx-toastr';
import {finalize} from 'rxjs/operators';
import {definitionType, DefinitionTypeOutil, FichierOutil, Outil} from '../../../../../type/outil';
import {User} from '../../../../../type/issue';
import {accepte, extensionFichier, fichierLisible, messageErreur, tailleLisible} from '../../../../../type/outil.util';
import {iconeFichier} from '../../../../../common/liste-fichiers/fichiers-issue';
import {OutilService} from '../../../../../services/outil.service';
import {UserService} from '../../../../../services/user.service';
import {ConfirmationDialogService} from '../../../../../services/confirmation-dialog.service';
import {EnvoiFichiersOutil} from '../envoi-fichiers-outil';

export interface OutilFicheData {
  espaceId: number;
  outil: Outil;
}

/** Ce que la page doit faire à la fermeture de la fiche. */
export type SortieFiche = 'modifier' | 'supprime' | 'change' | undefined;

/**
 * Fiche d'un outil (DT-019) : description, lien, et ses fichiers à
 * télécharger ou à lire sur place (vidéo, son). Tout membre qui la voit peut
 * y ajouter des fichiers, par le trombone ou en les glissant sur la fiche ;
 * supprimer un fichier reste à celui qui l'a ajouté, à l'auteur et à
 * l'administrateur (le serveur rend `supprimable`).
 */
@Component({
  standalone: false,
  selector: 'app-outil-fiche-dialog',
  templateUrl: './outil-fiche-dialog.component.html',
  styleUrls: ['../outils-dialog.css', './outil-fiche-dialog.component.css']
})
export class OutilFicheDialogComponent implements OnInit {

  protected outil: Outil;
  protected readonly definition: DefinitionTypeOutil;
  protected readonly envoi: EnvoiFichiersOutil;
  protected accept = '';
  protected surZone = false;
  /** Fichier vidéo ou son en cours de lecture dans la fiche. */
  protected lecture?: FichierOutil;
  private change = false;

  protected readonly tailleLisible = tailleLisible;
  protected readonly lisible = fichierLisible;

  constructor(@Inject(MAT_DIALOG_DATA) private readonly data: OutilFicheData,
              private readonly dialogRef: MatDialogRef<OutilFicheDialogComponent, SortieFiche>,
              private readonly outilService: OutilService,
              private readonly userService: UserService,
              private readonly confirmation: ConfirmationDialogService,
              private readonly toastr: ToastrService) {
    this.outil = data.outil;
    this.definition = definitionType(data.outil.typeOutil)!;
    this.envoi = new EnvoiFichiersOutil(outilService);
  }

  ngOnInit(): void {
    this.outilService.regles().subscribe(regles => {
      const regle = regles.find(r => r.typeOutil === this.outil.typeOutil);
      this.accept = accepte(regle);
      this.envoi.definirRegle(regle);
    });
  }

  protected icone(fichier: FichierOutil): string {
    return iconeFichier(extensionFichier(fichier.nom));
  }

  protected photo(user: User | undefined): string {
    return this.userService.getUrlPhoto(user as User);
  }

  protected nomDe(user: User | undefined): string {
    return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  }

  protected url(fichier: FichierOutil, apercu = false): string {
    return this.outilService.urlFichier(fichier, apercu);
  }

  /** Vidéo et son : lus dans la fiche ; PDF et image : ouverts dans un onglet ; le reste : téléchargé. */
  ouvrir(fichier: FichierOutil): void {
    const lisible = fichierLisible(fichier);
    if (lisible === 'video' || lisible === 'audio') {
      this.lecture = this.lecture?.id === fichier.id ? undefined : fichier;
      return;
    }
    if (lisible) {
      window.open(this.url(fichier, true), '_blank', 'noopener');
    } else {
      // Envoyé en pièce jointe par le serveur : le navigateur télécharge sans quitter la page.
      window.location.href = this.url(fichier);
    }
  }

  choisir(input: HTMLInputElement): void {
    this.ajouter(input.files);
    input.value = '';
  }

  survoler(event: DragEvent, dessus: boolean): void {
    event.preventDefault();
    this.surZone = dessus;
  }

  deposer(event: DragEvent): void {
    this.surZone = false;
    this.ajouter(EnvoiFichiersOutil.fichiersDeposes(event));
  }

  supprimerFichier(fichier: FichierOutil): void {
    this.confirmation.confirm('Supprimer le fichier', `Supprimer « ${fichier.nom} » ?`, 'Supprimer', 'Annuler')
      .then(ok => {
        if (!ok) {
          return;
        }
        this.outilService.supprimerFichier(this.data.espaceId, fichier.id).subscribe({
          next: () => {
            this.outil = {...this.outil, fichiers: this.outil.fichiers.filter(f => f.id !== fichier.id)};
            if (this.lecture?.id === fichier.id) {
              this.lecture = undefined;
            }
            this.change = true;
          },
          error: e => this.toastr.error(messageErreur(e, "Le fichier n'a pas été supprimé"))
        });
      })
      .catch(() => undefined);
  }

  supprimerOutil(): void {
    this.confirmation.confirm('Supprimer l\'outil',
      `Supprimer « ${this.outil.titre} » et ses ${this.outil.fichiers.length} fichier(s) ?`, 'Supprimer', 'Annuler')
      .then(ok => {
        if (!ok) {
          return;
        }
        this.outilService.supprimer(this.data.espaceId, this.outil.id).subscribe({
          next: () => this.dialogRef.close('supprime'),
          error: e => this.toastr.error(messageErreur(e, "L'outil n'a pas été supprimé"))
        });
      })
      .catch(() => undefined);
  }

  modifier(): void {
    this.dialogRef.close('modifier');
  }

  fermer(): void {
    this.dialogRef.close(this.change ? 'change' : undefined);
  }

  private ajouter(fichiers: FileList | null | undefined): void {
    this.envoi.ajouter(fichiers);
    this.envoi.envoyer(this.outil.id)
      .pipe(finalize(() => this.envoi.envois = this.envoi.envois.filter(e => e.statut === 'erreur')))
      .subscribe(fichier => {
        this.outil = {...this.outil, fichiers: [...this.outil.fichiers, fichier]};
        this.change = true;
      });
  }
}
