import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ChooseDialogComponent} from '../../../../../common/icone-field/choose-dialog/choose-dialog.component';
import {finalize} from 'rxjs/operators';
import {
  definitionType,
  DefinitionTypeOutil,
  DossierOutil,
  Outil,
  PorteeOutil,
  RegleFichiersOutil,
  TypeOutil
} from '../../../../../type/outil';
import {accepte, extensionFichier, messageErreur, tailleLisible} from '../../../../../type/outil.util';
import {iconeFichier} from '../../../../../common/liste-fichiers/fichiers-issue';
import {OutilService} from '../../../../../services/outil.service';
import {EnvoiFichier, EnvoiFichiersOutil} from '../envoi-fichiers-outil';

export interface OutilDialogData {
  espaceId: number;
  espaceNom: string;
  typeOutil: TypeOutil;
  /** Dossier ouvert : l'outil créé y est rangé ; absent à la racine du type. */
  dossier?: DossierOutil | null;
  /** Outil à modifier ; absent pour créer. */
  outil?: Outil | null;
}

/**
 * Création ou modification d'un outil (DT-019). Les champs suivent le type :
 * version pour un logiciel ou un modèle, lien obligatoire pour un lien. À la
 * création, on choisit de rester dans l'espace ou de partager avec tous, et
 * on joint les fichiers, envoyés juste après l'enregistrement.
 */
@Component({
  standalone: false,
  selector: 'app-outil-dialog',
  templateUrl: './outil-dialog.component.html',
  styleUrl: '../outils-dialog.css'
})
export class OutilDialogComponent implements OnInit {

  protected readonly definition: DefinitionTypeOutil;
  protected readonly verrouille: boolean;
  protected titre: string;
  protected description: string;
  protected version: string;
  protected url: string;
  /** Icône choisie (classe Font Awesome) ; vide : celle du type. */
  protected iconeChoisie: string;
  protected portee: PorteeOutil;
  protected regle?: RegleFichiersOutil;
  protected accept = '';
  protected surZone = false;
  protected enCours = false;
  protected erreur = '';
  /** Outil enregistré dont des fichiers ont échoué : il ne reste qu'à fermer. */
  protected enregistre?: Outil;
  protected readonly envoi: EnvoiFichiersOutil;
  protected readonly tailleLisible = tailleLisible;

  constructor(@Inject(MAT_DIALOG_DATA) protected readonly data: OutilDialogData,
              private readonly dialogRef: MatDialogRef<OutilDialogComponent, Outil>,
              private readonly outilService: OutilService,
              private readonly modalService: NgbModal) {
    this.definition = definitionType(data.typeOutil)!;
    this.verrouille = data.dossier?.portee === 'ESPACE';
    this.titre = data.outil?.titre ?? '';
    this.description = data.outil?.description ?? '';
    this.version = data.outil?.version ?? '';
    this.url = data.outil?.url ?? '';
    this.iconeChoisie = data.outil?.icone ?? '';
    this.portee = data.outil?.portee ?? 'ESPACE';
    this.envoi = new EnvoiFichiersOutil(outilService);
  }

  ngOnInit(): void {
    this.outilService.regles().subscribe(regles => {
      this.regle = regles.find(r => r.typeOutil === this.data.typeOutil);
      this.accept = accepte(this.regle);
      this.envoi.definirRegle(this.regle);
    });
  }

  protected get modification(): boolean {
    return !!this.data.outil;
  }

  protected get valide(): boolean {
    return !!this.titre.trim() && (this.definition.lien !== 'obligatoire' || !!this.url.trim());
  }

  protected icone(envoi: EnvoiFichier): string {
    return iconeFichier(extensionFichier(envoi.file.name));
  }

  /**
   * Icône de l'outil (un logiciel : « fab fa-windows »…) : le sélecteur
   * d'icônes de l'application (DT-010). Fermé sans choix : rien ne change.
   */
  choisirIcone(): void {
    const fenetre = this.modalService.open(ChooseDialogComponent, {size: 'lg'});
    fenetre.result.then(
      resultat => {
        if (resultat?.icone?.value) {
          this.iconeChoisie = String(resultat.icone.value);
        }
      },
      () => undefined);
  }

  /** Retour à l'icône du type. */
  retirerIcone(): void {
    this.iconeChoisie = '';
  }

  choisir(input: HTMLInputElement): void {
    this.envoi.ajouter(input.files);
    input.value = '';
  }

  survoler(event: DragEvent, dessus: boolean): void {
    event.preventDefault();
    this.surZone = dessus;
  }

  deposer(event: DragEvent): void {
    this.surZone = false;
    this.envoi.ajouter(EnvoiFichiersOutil.fichiersDeposes(event));
  }

  enregistrer(): void {
    if (!this.valide || this.enCours || this.enregistre) {
      return;
    }
    this.enCours = true;
    this.erreur = '';
    this.outilService.enregistrer(this.data.espaceId, {
      id: this.data.outil?.id ?? null,
      titre: this.titre,
      description: this.description,
      typeOutil: this.data.typeOutil,
      portee: this.portee,
      dossierId: this.data.outil ? this.data.outil.dossierId ?? null : this.data.dossier?.id ?? null,
      url: this.definition.lien === 'absent' ? null : this.url,
      version: this.definition.version ? this.version : null,
      icone: this.iconeChoisie || null
    }).subscribe({
      next: outil => this.envoyerFichiers(outil),
      error: e => {
        this.enCours = false;
        this.erreur = messageErreur(e, "L'outil n'a pas été enregistré");
      }
    });
  }

  /** Après un enregistrement, la page doit se rafraîchir même si des fichiers ont échoué. */
  fermer(): void {
    this.dialogRef.close(this.enregistre);
  }

  /** Fichiers envoyés après l'outil ; on ne ferme que si tous sont passés, sinon on montre lesquels ont échoué. */
  private envoyerFichiers(outil: Outil): void {
    if (!this.envoi.enAttente.length) {
      this.dialogRef.close(outil);
      return;
    }
    this.envoi.envoyer(outil.id).pipe(finalize(() => {
      this.enCours = false;
      if (this.envoi.envois.every(e => e.statut === 'ok')) {
        this.dialogRef.close(outil);
      } else {
        this.enregistre = outil;
        this.erreur = "L'outil est enregistré, mais des fichiers n'ont pas été envoyés. Vous pourrez les ajouter depuis sa fiche.";
      }
    })).subscribe();
  }
}
