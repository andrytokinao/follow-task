import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {definitionType, DossierOutil, PorteeOutil, TypeOutil} from '../../../../../type/outil';
import {messageErreur} from '../../../../../type/outil.util';
import {OutilService} from '../../../../../services/outil.service';

export interface DossierOutilDialogData {
  espaceId: number;
  espaceNom: string;
  typeOutil: TypeOutil;
  /** Dossier où l'on crée ; absent à la racine du type. */
  parent?: DossierOutil | null;
  /** Dossier à renommer ; absent pour créer. */
  dossier?: DossierOutil | null;
}

/**
 * Création ou renommage d'un dossier du menu Outils (DT-019). À la création,
 * on choisit de le garder dans l'espace ou de le partager avec tous ; sous un
 * dossier réservé à l'espace, il y reste forcément. Rend le dossier enregistré.
 */
@Component({
  standalone: false,
  selector: 'app-dossier-outil-dialog',
  templateUrl: './dossier-outil-dialog.component.html',
  styleUrl: '../outils-dialog.css'
})
export class DossierOutilDialogComponent {

  protected nom: string;
  protected portee: PorteeOutil;
  protected readonly verrouille: boolean;
  protected readonly typeLibelle: string;
  protected enCours = false;
  protected erreur = '';

  constructor(@Inject(MAT_DIALOG_DATA) protected readonly data: DossierOutilDialogData,
              private readonly dialogRef: MatDialogRef<DossierOutilDialogComponent, DossierOutil>,
              private readonly outilService: OutilService) {
    this.nom = data.dossier?.nom ?? '';
    this.verrouille = data.parent?.portee === 'ESPACE';
    this.portee = data.dossier?.portee ?? 'ESPACE';
    this.typeLibelle = definitionType(data.typeOutil)?.libelle ?? '';
  }

  protected get renommage(): boolean {
    return !!this.data.dossier;
  }

  enregistrer(): void {
    if (!this.nom.trim() || this.enCours) {
      return;
    }
    this.enCours = true;
    this.erreur = '';
    this.outilService.enregistrerDossier(this.data.espaceId, {
      id: this.data.dossier?.id ?? null,
      nom: this.nom,
      typeOutil: this.data.typeOutil,
      portee: this.portee,
      parentId: this.data.parent?.id ?? null
    }).subscribe({
      next: dossier => this.dialogRef.close(dossier),
      error: e => {
        this.enCours = false;
        this.erreur = messageErreur(e, "Le dossier n'a pas été enregistré");
      }
    });
  }

  annuler(): void {
    this.dialogRef.close();
  }
}
