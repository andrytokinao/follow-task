import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {of, Subscription} from 'rxjs';
import {catchError, switchMap, tap} from 'rxjs/operators';
import {DirectionService} from './direction.service';
import {EspaceDirection, ProjetDirection} from './direction.model';
import {EspaceDirectionService} from './espace/espace-direction.service';

/**
 * Fiches projets du cockpit de direction : les projets en cours de l'espace
 * de travail choisi dans le menu (`/direction/TOPO`).
 *
 * À gauche, la liste des projets ; à droite, la fiche du projet choisi
 * (avancement, tâches, commentaires, pièces livrables, champs personnalisés).
 *
 * Lecture seule, sauf les commentaires : la direction peut commenter le projet
 * et chacune de ses tâches.
 */
@Component({
  standalone: false,
  selector: 'app-direction',
  templateUrl: './direction.component.html',
  styleUrl: './direction.component.css'
})
export class DirectionComponent implements OnInit, OnDestroy {

  espace: EspaceDirection | null = null;
  projets: ProjetDirection[] = [];

  chargement = true;
  erreur = false;

  selection: ProjetDirection | null = null;

  private abonnement?: Subscription;

  constructor(private directionService: DirectionService,
              private espaceService: EspaceDirectionService,
              private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.abonnement = this.espaceService.espace$.pipe(
      tap(espace => {
        this.espace = espace;
        this.chargement = true;
        this.erreur = false;
        this.selection = null;
      }),
      // L'échec reste dans l'espace en cause : changer d'espace recharge encore.
      switchMap(espace => this.directionService.projets(espace.nom).pipe(catchError(() => of(null))))
    ).subscribe(projets => {
      this.chargement = false;
      this.erreur = projets == null;
      this.projets = projets ?? [];
      // ?projet=12 : le projet choisi sur l'accueil.
      const demande = Number(this.route.snapshot.queryParamMap.get('projet'));
      this.selection = this.projets.find(p => p.id === demande) ?? this.projets[0] ?? null;
    });
  }

  ngOnDestroy(): void {
    this.abonnement?.unsubscribe();
  }

  choisirProjet(p: ProjetDirection): void {
    this.selection = p;
  }

  parId(_: number, p: ProjetDirection): number {
    return p.id;
  }
}
