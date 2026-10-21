import {HttpEventType} from '@angular/common/http';
import {concatMap, from, Observable, of} from 'rxjs';
import {catchError, filter, map, tap} from 'rxjs/operators';
import {FichierOutil, RegleFichiersOutil} from '../../../../type/outil';
import {messageErreur, refusFichier} from '../../../../type/outil.util';
import {OutilService} from '../../../../services/outil.service';

export type StatutEnvoi = 'attente' | 'envoi' | 'ok' | 'erreur';

/** Un fichier choisi, et où en est son envoi. */
export interface EnvoiFichier {
  file: File;
  statut: StatutEnvoi;
  progression: number;
  message?: string;
}

/**
 * Fichiers d'un outil à envoyer (DT-019) : choisis ou déposés, contrôlés tout
 * de suite avec les règles du serveur, puis envoyés l'un après l'autre. Un
 * échec n'arrête pas les suivants.
 */
export class EnvoiFichiersOutil {

  envois: EnvoiFichier[] = [];

  constructor(private readonly outilService: OutilService,
              private regle?: RegleFichiersOutil) {
  }

  definirRegle(regle: RegleFichiersOutil | undefined): void {
    this.regle = regle;
  }

  /** Ajoute les fichiers ; ceux qui ne respectent pas la règle sont marqués en erreur. */
  ajouter(fichiers: FileList | File[] | null | undefined): void {
    for (const file of Array.from(fichiers ?? [])) {
      const refus = refusFichier(file, this.regle);
      this.envois.push({file, statut: refus ? 'erreur' : 'attente', progression: 0, message: refus ?? undefined});
    }
  }

  retirer(envoi: EnvoiFichier): void {
    this.envois = this.envois.filter(e => e !== envoi);
  }

  get enAttente(): EnvoiFichier[] {
    return this.envois.filter(e => e.statut === 'attente');
  }

  get enCours(): boolean {
    return this.envois.some(e => e.statut === 'envoi');
  }

  /** Envoie les fichiers en attente ; émet chaque fichier enregistré. */
  envoyer(outilId: number): Observable<FichierOutil> {
    return from(this.enAttente).pipe(
      concatMap(envoi => this.envoyerUn(outilId, envoi)),
      filter((fichier): fichier is FichierOutil => !!fichier));
  }

  /** Déposer des fichiers sur une zone : le navigateur ne doit pas les ouvrir. */
  static fichiersDeposes(event: DragEvent): FileList | null {
    event.preventDefault();
    event.stopPropagation();
    return event.dataTransfer?.files ?? null;
  }

  private envoyerUn(outilId: number, envoi: EnvoiFichier): Observable<FichierOutil | null> {
    envoi.statut = 'envoi';
    return this.outilService.deposer(outilId, envoi.file).pipe(
      tap(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          envoi.progression = Math.round(100 * event.loaded / event.total);
        }
      }),
      filter(event => event.type === HttpEventType.Response),
      map(event => {
        envoi.statut = 'ok';
        envoi.progression = 100;
        return (event as any).body as FichierOutil;
      }),
      catchError(e => {
        envoi.statut = 'erreur';
        envoi.message = messageErreur(e, "L'envoi a échoué");
        return of(null);
      }));
  }
}
