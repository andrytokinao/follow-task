import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {LayoutService} from '../../../../services/layout.service';
import {EspaceDirection} from '../direction.model';
import {EspaceDirectionService} from '../espace/espace-direction.service';

/**
 * Cadre de tout le cockpit de direction, comme celui d'un espace de travail :
 * menu à gauche, réductible, et la page à droite sur toute la largeur restante.
 *
 * Le menu mène à l'accueil (tous les projets) et, pour l'espace choisi, aux
 * trois pages : situation du jour, fiches projets, Gantt. Sur l'accueil, ces
 * entrées ouvrent le dernier espace consulté. Le repli est la même préférence
 * que dans les espaces de travail (`LayoutService`).
 */
@Component({
  standalone: false,
  selector: 'app-direction-shell',
  templateUrl: './direction-shell.component.html',
  styleUrl: './direction-shell.component.css'
})
export class DirectionShellComponent implements OnInit, OnDestroy {

  espaces: EspaceDirection[] = [];
  /** Espace de l'adresse ; null sur l'accueil. */
  espace: EspaceDirection | null = null;
  /** Espace des liens du menu : celui de l'adresse, sinon le dernier consulté. */
  espaceDesLiens: EspaceDirection | null = null;
  /** Liens des pages d'espace : des champs, pas un tableau recréé à chaque rendu. */
  lienSituation: string[] = ['/direction'];
  lienFiches: string[] = ['/direction'];
  lienGantt: string[] = ['/direction'];
  reduite = false;

  private parDefaut: EspaceDirection | null = null;
  private abonnements = new Subscription();

  constructor(private espaceService: EspaceDirectionService,
              private router: Router,
              private route: ActivatedRoute,
              protected layout: LayoutService) {
  }

  ngOnInit(): void {
    this.abonnements.add(this.espaceService.espaces().subscribe(espaces => this.espaces = espaces));
    this.abonnements.add(this.espaceService.parDefaut().subscribe(espace => {
      this.parDefaut = espace;
      this.lierA(this.espace ?? this.espaceDesLiens ?? espace);
    }));
    this.abonnements.add(this.espaceService.courant$.subscribe(espace => {
      this.espace = espace;
      this.lierA(espace ?? this.espaceDesLiens ?? this.parDefaut);
    }));
    this.abonnements.add(this.layout.sidebarReduite$.subscribe(reduite => this.reduite = reduite));
  }

  ngOnDestroy(): void {
    this.abonnements.unsubscribe();
  }

  /** Pages de l'espace du menu ; l'accueil si aucun espace n'existe. */
  private lierA(espace: EspaceDirection | null): void {
    this.espaceDesLiens = espace;
    const base = espace ? ['/direction', espace.prefixe] : ['/direction'];
    this.lienFiches = base;
    this.lienSituation = espace ? [...base, 'situation'] : base;
    this.lienGantt = espace ? [...base, 'gantt'] : base;
  }

  /** Même page dans l'autre espace ; depuis l'accueil, ses fiches projets. */
  choisirEspace(espace: EspaceDirection): void {
    if (espace.prefixe === this.espace?.prefixe) {
      return;
    }
    const page = this.espace ? (this.route.firstChild?.firstChild?.snapshot.routeConfig?.path ?? '') : '';
    this.router.navigate(['/direction', espace.prefixe, ...(page ? [page] : [])]);
  }

  initiale(espace: EspaceDirection | null): string {
    return espace ? espace.prefixe.charAt(0).toUpperCase() : '∗';
  }
}
