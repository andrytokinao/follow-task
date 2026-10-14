import {Component, EventEmitter, Output} from '@angular/core';
import {ImportAnnuaireService} from '../../../../../../services/import-annuaire.service';
import {ApercuImportAnnuaire} from '../../../../../../type/import-annuaire';
import {RapportImportUsers} from '../../../../../../type/import-users';

/**
 * Onglet « Depuis une URL » de la fenêtre d'import : crée des comptes à partir
 * des fiches d'un annuaire externe.
 *
 * <p>Deux temps, pour que rien ne soit créé à l'aveugle : « Rechercher » lit
 * les fiches et montre les comptes qui leur ressemblent, puis « Importer » crée
 * ce qui doit l'être. Une personne déjà présente (même email, téléphone ou CIN)
 * est ignorée ; un simple homonyme n'est créé que si on le confirme.</p>
 *
 * <p>Le rapport est remis à la fenêtre parente, qui l'affiche comme celui d'un
 * tableur.</p>
 */
@Component({
  standalone: false,
  selector: 'app-import-annuaire',
  templateUrl: './import-annuaire.component.html',
  styleUrl: './import-annuaire.component.css'
})
export class ImportAnnuaireComponent {

  @Output() termine = new EventEmitter<RapportImportUsers>();
  @Output() annuler = new EventEmitter<void>();

  saisie = '';
  motDePasse = '';
  motDePasseVisible = false;

  apercus?: ApercuImportAnnuaire[];
  recherche = false;
  import = false;
  erreur = '';

  /** Références créées malgré un homonyme. */
  private confirmees = new Set<string>();

  /** Photos qui n'ont pas pu s'afficher : on montre les initiales à la place. */
  private photosEnErreur = new Set<string>();

  constructor(private importAnnuaireService: ImportAnnuaireService) {
  }

  // -----------------------------------------------------------------
  // Saisie
  // -----------------------------------------------------------------

  /** Une adresse par ligne ; virgules et espaces acceptés pour un collage rapide. */
  get references(): string[] {
    return [...new Set(this.saisie.split(/[\s,;]+/).map(r => r.trim()).filter(r => r))];
  }

  /** Changer la liste rend l'aperçu caduc. */
  saisieModifiee(): void {
    this.apercus = undefined;
    this.confirmees.clear();
    this.erreur = '';
  }

  // -----------------------------------------------------------------
  // Aperçu
  // -----------------------------------------------------------------

  rechercher(): void {
    if (!this.references.length || this.recherche) {
      return;
    }
    this.recherche = true;
    this.erreur = '';
    this.importAnnuaireService.apercu(this.references).subscribe({
      next: apercus => {
        this.apercus = apercus;
        this.confirmees.clear();
        this.recherche = false;
      },
      error: erreur => {
        this.erreur = this.motif(erreur, "La recherche n'a pas abouti.");
        this.recherche = false;
      }
    });
  }

  estConfirmee(apercu: ApercuImportAnnuaire): boolean {
    return this.confirmees.has(apercu.reference);
  }

  basculerConfirmation(apercu: ApercuImportAnnuaire, confirmee: boolean): void {
    if (confirmee) {
      this.confirmees.add(apercu.reference);
    } else {
      this.confirmees.delete(apercu.reference);
    }
  }

  /** Nombre de comptes que l'import créera, au vu de l'aperçu. */
  get aCreer(): number {
    return (this.apercus ?? []).filter(a =>
      a.verdict === 'NOUVEAU' || (a.verdict === 'A_CONFIRMER' && this.estConfirmee(a))).length;
  }

  get peutImporter(): boolean {
    return !!this.apercus && this.aCreer > 0 && !!this.motDePasse.trim() && !this.import;
  }

  // -----------------------------------------------------------------
  // Import
  // -----------------------------------------------------------------

  importer(): void {
    if (!this.peutImporter || !this.apercus) {
      return;
    }
    this.import = true;
    this.erreur = '';
    // Toutes les références partent, ignorées comprises : le rapport dit
    // pourquoi chacune a été écartée.
    this.importAnnuaireService.importer({
      references: this.apercus.map(a => a.reference),
      confirmees: [...this.confirmees],
      motDePasse: this.motDePasse
    }).subscribe({
      next: rapport => {
        this.import = false;
        this.termine.emit(rapport);
      },
      error: erreur => {
        this.erreur = this.motif(erreur, "L'import n'a pas abouti.");
        this.import = false;
      }
    });
  }

  // -----------------------------------------------------------------
  // Affichage
  // -----------------------------------------------------------------

  photoVisible(apercu: ApercuImportAnnuaire): boolean {
    return !!apercu.profil?.photoUrl && !this.photosEnErreur.has(apercu.reference);
  }

  photoEnErreur(apercu: ApercuImportAnnuaire): void {
    this.photosEnErreur.add(apercu.reference);
  }

  initiales(apercu: ApercuImportAnnuaire): string {
    const p = apercu.profil;
    return ((p?.nom?.[0] ?? '') + (p?.prenoms?.[0] ?? '')).toUpperCase() || '?';
  }

  libelleVerdict(apercu: ApercuImportAnnuaire): string {
    switch (apercu.verdict) {
      case 'NOUVEAU':
        return 'Nouveau';
      case 'A_CONFIRMER':
        return 'Homonyme';
      case 'DEJA_PRESENT':
        return 'Déjà présent';
      default:
        return 'Illisible';
    }
  }

  private motif(erreur: any, defaut: string): string {
    // Le serveur renvoie le motif en texte brut sur un 400 ; un 403 n'en porte pas.
    return (typeof erreur?.error === 'string' && erreur.error)
      || (erreur?.status === 403 ? "Vous n'avez pas le droit de créer des utilisateurs." : defaut);
  }
}
