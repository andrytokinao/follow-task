import {ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild} from '@angular/core';
import {MatMenuTrigger} from '@angular/material/menu';
import {forkJoin, Observable, of, Subscription} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {CustomField, CustomFieldValue} from '../../../../../type/issue';
import {versJourIso} from '../gantt-dates.util';
import {avecChamps, CaseChamps, LigneChamp, lignesDeCase} from './gantt-champs-case';
import {GanttChampsService} from './gantt-champs.service';

/** Valeurs d'une demande après une écriture : l'hôte refait son diagramme. */
export interface ValeursModifiees {
  issueId: number;
  valeurs: CustomFieldValue[];
}

/**
 * Menu d'une case du Gantt, ouvert à l'endroit du clic : les champs datés de
 * la demande, une case à cocher chacun. Cocher date le champ au début de la
 * case ; décocher retire ses dates de la case. Un champ à valeur unique déjà
 * daté ailleurs ne se coche pas. Administrateur ou chef de projet de l'espace :
 * créer un champ daté.
 */
@Component({
  standalone: false,
  selector: 'app-gantt-champs-case',
  templateUrl: './gantt-champs-case.component.html',
  styleUrls: ['./gantt-champs-case.component.css']
})
export class GanttChampsCaseComponent implements OnDestroy {

  @Output() modifie = new EventEmitter<ValeursModifiees>();

  @ViewChild(MatMenuTrigger) private trigger!: MatMenuTrigger;

  x = 0;
  y = 0;
  cellule: CaseChamps | null = null;
  champs: CustomField[] = [];
  lignes: LigneChamp[] = [];
  chargement = false;
  /** Écriture en cours : les cases restent figées jusqu'à la réponse. */
  enCours = false;
  erreur: string | null = null;
  peutCreer = false;
  nouveauNom = '';
  nouveauUnique = true;

  private abonnement?: Subscription;

  constructor(private champsService: GanttChampsService, private cdr: ChangeDetectorRef) {
  }

  ngOnDestroy(): void {
    this.abonnement?.unsubscribe();
  }

  ouvrir(cellule: CaseChamps, event: MouseEvent): void {
    // Le clic courant n'est pas fini : ouvrir tout de suite le laisserait refermer le menu.
    setTimeout(() => {
      if (this.trigger.menuOpen) {
        this.trigger.closeMenu();
      }
      this.x = event.clientX;
      this.y = event.clientY;
      this.cellule = cellule;
      this.erreur = null;
      this.nouveauNom = '';
      this.charger();
      this.cdr.detectChanges();
      this.trigger.openMenu();
    });
  }

  basculer(ligne: LigneChamp): void {
    const cellule = this.cellule;
    if (!cellule || this.enCours || (!ligne.coche && ligne.bloque)) {
      return;
    }
    // Décocher retire chaque date de la case ; la dernière réponse porte toutes les valeurs restantes.
    const ecriture: Observable<CustomFieldValue[]> = ligne.coche
      ? forkJoin(ligne.ici.map(v => this.champsService.retirer(v.id as number))).pipe(map(reponses => reponses[reponses.length - 1]))
      : this.champsService.dater(cellule.issueId, ligne.champ, versJourIso(cellule.debut));
    this.ecrire(ecriture);
  }

  creer(): void {
    const cellule = this.cellule;
    const nom = this.nouveauNom.trim();
    if (!cellule?.projectId || !nom || this.enCours) {
      return;
    }
    this.enCours = true;
    this.erreur = null;
    this.champsService.creer(cellule.projectId, nom, this.nouveauUnique).subscribe({
      next: () => {
        this.enCours = false;
        this.nouveauNom = '';
        this.charger();
      },
      error: e => this.echouer(e)
    });
  }

  parChamp(_: number, ligne: LigneChamp): unknown {
    return ligne.champ.id;
  }

  /** « déjà au 12/10/2026 » : où sont les dates du champ hors de la case. */
  ailleurs(ligne: LigneChamp): string {
    return ligne.ailleurs.map(jour => new Date(jour).toLocaleDateString('fr-FR')).join(', ');
  }

  private charger(): void {
    const cellule = this.cellule!;
    this.abonnement?.unsubscribe();
    this.chargement = true;
    this.champs = [];
    this.lignes = [];
    this.peutCreer = false;
    this.abonnement = this.champsService.champsDates(cellule.issueTypeId)
      .pipe(catchError(() => of(null)))
      .subscribe(champs => {
        this.chargement = false;
        if (!champs) {
          this.erreur = 'Impossible de charger les champs.';
          return;
        }
        this.champs = champs;
        this.lignes = lignesDeCase(this.champs, cellule);
      });
    // À part : les champs s'affichent sans attendre le droit de créer.
    if (cellule.prefixe && cellule.projectId) {
      this.abonnement.add(this.champsService.peutCreer(cellule.prefixe).subscribe(droit => this.peutCreer = droit));
    }
  }

  private ecrire(ecriture: Observable<CustomFieldValue[]>): void {
    const cellule = this.cellule!;
    this.enCours = true;
    this.erreur = null;
    ecriture.subscribe({
      next: reponse => {
        const valeurs = avecChamps(reponse, this.champs);
        this.enCours = false;
        this.cellule = {...cellule, valeurs};
        this.lignes = lignesDeCase(this.champs, this.cellule);
        this.modifie.emit({issueId: cellule.issueId, valeurs});
      },
      error: e => this.echouer(e)
    });
  }

  private echouer(e: any): void {
    this.enCours = false;
    this.erreur = e?.graphQLErrors?.[0]?.message ?? e?.message ?? 'Enregistrement impossible.';
  }
}
