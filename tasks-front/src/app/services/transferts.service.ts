import {Injectable} from '@angular/core';
import {HttpEventType} from '@angular/common/http';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {map} from 'rxjs/operators';
import {IssueService} from './issue.service';

export type EtatTransfert = 'attente' | 'encours' | 'termine' | 'erreur';

export interface TransfertFichier {
  id: number;
  nom: string;
  /** Chemin encodé du dossier cible. */
  destination: string;
  /** Nom du dossier cible, pour l'affichage. */
  destinationNom: string;
  taille: number;
  progression: number;
  etat: EtatTransfert;
  erreur?: string;
}

export interface DemandeTransfert {
  file: File;
  relativePath: string;
  destination: string;
  destinationNom: string;
}

/**
 * File d'envoi de fichiers, partagée par toute l'application.
 *
 * Elle vit dans un service et non dans l'écran qui lance l'envoi : un upload
 * dure, et l'utilisateur doit pouvoir changer de page pendant ce temps. Porté
 * par l'explorateur, le transfert s'arrêtait — ou, au mieux, on perdait toute
 * trace de son avancement — dès qu'on quittait l'écran.
 *
 * Les envois sont séquentiels : plusieurs fichiers en parallèle se partagent
 * la bande passante montante sans rien terminer plus vite, et rendent la
 * progression illisible.
 */
@Injectable({providedIn: 'root'})
export class TransfertsService {

  private readonly fileSubject = new BehaviorSubject<TransfertFichier[]>([]);
  readonly transferts$ = this.fileSubject.asObservable();

  /** Émis à chaque fichier reçu par le serveur : les écrans se rafraîchissent. */
  private readonly termineSubject = new Subject<TransfertFichier>();
  readonly termine$ = this.termineSubject.asObservable();

  private compteur = 0;
  private enCours = false;
  /** Fichiers à part : le modèle exposé aux écrans reste sérialisable. */
  private readonly fichiers = new Map<number, File>();

  constructor(private issueService: IssueService) {
  }

  /** Un envoi est en cours ou en attente. */
  readonly actif$: Observable<boolean> = this.transferts$.pipe(
    map(liste => liste.some(t => t.etat === 'attente' || t.etat === 'encours'))
  );

  /**
   * Progression de l'ensemble, pondérée par la taille des fichiers : un gros
   * fichier ne doit pas compter autant qu'un petit dans le pourcentage global.
   */
  readonly progressionGlobale$: Observable<number> = this.transferts$.pipe(
    map(liste => {
      const encours = liste.filter(t => t.etat !== 'erreur');
      const total = encours.reduce((somme, t) => somme + Math.max(1, t.taille), 0);
      if (!total) {
        return 0;
      }
      const envoye = encours.reduce(
        (somme, t) => somme + Math.max(1, t.taille) * (t.progression / 100), 0);
      return Math.round((envoye / total) * 100);
    })
  );

  enfile(demandes: DemandeTransfert[]): void {
    if (!demandes?.length) {
      return;
    }
    const nouveaux: TransfertFichier[] = demandes.map(demande => {
      const id = ++this.compteur;
      this.fichiers.set(id, demande.file);
      return {
        id,
        nom: demande.relativePath || demande.file.name,
        destination: demande.destination,
        destinationNom: demande.destinationNom,
        taille: demande.file.size ?? 0,
        progression: 0,
        etat: 'attente' as EtatTransfert
      };
    });

    this.fileSubject.next([...this.fileSubject.value, ...nouveaux]);
    this.traiterSuivant();
  }

  /** Retire un transfert de la liste. Un envoi en cours n'est pas interrompu. */
  retirer(id: number): void {
    this.fileSubject.next(this.fileSubject.value.filter(t => t.id !== id || t.etat === 'encours'));
    this.fichiers.delete(id);
  }

  /** Vide ce qui est terminé ou en erreur, et garde ce qui reste à envoyer. */
  effacerTermines(): void {
    const restants = this.fileSubject.value.filter(t => t.etat === 'attente' || t.etat === 'encours');
    const gardes = new Set(restants.map(t => t.id));
    [...this.fichiers.keys()].filter(id => !gardes.has(id)).forEach(id => this.fichiers.delete(id));
    this.fileSubject.next(restants);
  }

  private traiterSuivant(): void {
    if (this.enCours) {
      return;
    }
    const suivant = this.fileSubject.value.find(t => t.etat === 'attente');
    if (!suivant) {
      return;
    }
    const fichier = this.fichiers.get(suivant.id);
    if (!fichier) {
      // Retiré de la liste avant son tour.
      this.mettreAJour(suivant.id, {etat: 'erreur', erreur: 'Fichier introuvable'});
      this.traiterSuivant();
      return;
    }
    this.enCours = true;
    this.mettreAJour(suivant.id, {etat: 'encours'});

    this.issueService.uploadDansDossier(fichier, suivant.destination, suivant.nom).subscribe({
      next: evenement => {
        if (evenement.type === HttpEventType.UploadProgress) {
          const total = evenement.total || suivant.taille || 1;
          this.mettreAJour(suivant.id, {progression: Math.round((evenement.loaded / total) * 100)});
        } else if (evenement.type === HttpEventType.Response) {
          this.mettreAJour(suivant.id, {etat: 'termine', progression: 100});
          this.fichiers.delete(suivant.id);
          this.termineSubject.next(this.trouver(suivant.id));
        }
      },
      error: err => {
        console.error('upload ' + suivant.nom, err);
        this.mettreAJour(suivant.id, {
          etat: 'erreur',
          erreur: err?.error?.message ?? err?.message ?? 'Envoi impossible'
        });
        this.enCours = false;
        this.traiterSuivant();
      },
      complete: () => {
        this.enCours = false;
        this.traiterSuivant();
      }
    });
  }

  private trouver(id: number): TransfertFichier {
    return this.fileSubject.value.find(t => t.id === id);
  }

  private mettreAJour(id: number, champs: Partial<TransfertFichier>): void {
    this.fileSubject.next(this.fileSubject.value.map(t =>
      t.id === id ? {...t, ...champs} : t));
  }
}
