import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {UserService} from '../../../../../services/user.service';
import {LigneImportUser, RapportImportUsers} from '../../../../../type/import-users';

/**
 * Création d'utilisateurs en masse à partir d'un classeur Excel.
 *
 * <p>L'écran est construit autour d'un constat : un import n'est presque jamais
 * parfait du premier coup. Il ne se contente donc pas d'annoncer « réussi » ou
 * « échoué », il rend le détail ligne par ligne, avec le numéro de ligne du
 * fichier, pour que l'administrateur corrige son tableur et le relance.</p>
 *
 * <p>Le modèle est proposé avant même de choisir un fichier : deviner les
 * intitulés attendus est la première cause d'import raté.</p>
 */
@Component({
  standalone: false,
  selector: 'app-import-users',
  templateUrl: './import-users.component.html',
  styleUrl: './import-users.component.css'
})
export class ImportUsersComponent {

  fichier?: File;
  import = false;
  erreur = '';
  rapport?: RapportImportUsers;

  /** Vrai dès qu'un utilisateur a été créé : la liste devra être rechargée. */
  private quelqueChoseCree = false;

  constructor(public activeModal: NgbActiveModal,
              private userService: UserService) {
  }

  // -----------------------------------------------------------------
  // Choix du fichier
  // -----------------------------------------------------------------

  choisir(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.retenir(input.files?.[0]);
    // Sans cela, rechoisir le même fichier après correction n'émettrait
    // aucun évènement : la valeur de l'input n'aurait pas changé.
    input.value = '';
  }

  deposer(event: DragEvent): void {
    event.preventDefault();
    this.retenir(event.dataTransfer?.files?.[0]);
  }

  survol(event: DragEvent): void {
    // Sans ce preventDefault, le navigateur ouvre le fichier déposé à la place
    // de l'application.
    event.preventDefault();
  }

  private retenir(fichier?: File): void {
    if (!fichier) {
      return;
    }
    if (!/\.(xlsx|xls)$/i.test(fichier.name)) {
      this.erreur = 'Choisissez un classeur Excel (.xlsx ou .xls).';
      return;
    }
    this.fichier = fichier;
    this.erreur = '';
    this.rapport = undefined;
  }

  tailleLisible(): string {
    const octets = this.fichier?.size ?? 0;
    return octets < 1024 * 1024
      ? `${Math.max(1, Math.round(octets / 1024))} Ko`
      : `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
  }

  // -----------------------------------------------------------------
  // Modèle
  // -----------------------------------------------------------------

  telechargerModele(): void {
    this.userService.modeleImportUtilisateurs().subscribe({
      next: blob => this.enregistrerBlob(blob, 'modele-import-utilisateurs.xlsx'),
      error: () => this.erreur = "Le modèle n'a pas pu être téléchargé."
    });
  }

  private enregistrerBlob(blob: Blob, nom: string): void {
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nom;
    lien.click();
    // L'URL retient le blob en mémoire tant qu'elle n'est pas révoquée.
    URL.revokeObjectURL(url);
  }

  // -----------------------------------------------------------------
  // Import
  // -----------------------------------------------------------------

  lancer(): void {
    if (!this.fichier || this.import) {
      return;
    }
    this.import = true;
    this.erreur = '';
    this.rapport = undefined;

    this.userService.importerUtilisateurs(this.fichier).subscribe({
      next: rapport => {
        this.rapport = rapport;
        this.quelqueChoseCree = this.quelqueChoseCree || rapport.crees > 0;
        this.import = false;
      },
      error: erreur => {
        // Le serveur renvoie le motif en texte brut quand le classeur est
        // illisible ; un 403 n'en porte pas, d'où le repli sur les droits.
        this.erreur = (typeof erreur?.error === 'string' && erreur.error)
          || (erreur?.status === 403
            ? "Vous n'avez pas le droit de créer des utilisateurs."
            : "L'import n'a pas abouti.");
        this.import = false;
      }
    });
  }

  /** Reprendre avec un fichier corrigé sans rouvrir la fenêtre. */
  recommencer(): void {
    this.fichier = undefined;
    this.rapport = undefined;
    this.erreur = '';
  }

  // -----------------------------------------------------------------
  // Lecture du rapport
  // -----------------------------------------------------------------

  get rejets(): LigneImportUser[] {
    return (this.rapport?.lignes ?? []).filter(ligne => ligne.statut === 'REJETE');
  }

  /** Créés, mais dont la photo n'a pas suivi : à signaler sans alarmer. */
  get sansPhoto(): LigneImportUser[] {
    return (this.rapport?.lignes ?? []).filter(ligne => ligne.statut === 'CREE_SANS_PHOTO');
  }

  fermer(): void {
    // La liste ne se recharge que si elle a changé.
    this.activeModal.close(this.quelqueChoseCree);
  }
}
