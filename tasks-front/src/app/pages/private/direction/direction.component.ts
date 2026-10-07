import {Component, OnInit} from '@angular/core';
import {DirectionService} from './direction.service';
import {ProjetDirection} from './direction.model';

/**
 * Cockpit de direction : les projets en cours de la société, rangés par
 * département (onglets en haut). Un clic sur un projet affiche ses tâches.
 *
 * Lecture seule : pour agir sur une tâche, on repart vers son espace.
 */
@Component({
  standalone: false,
  selector: 'app-direction',
  templateUrl: './direction.component.html',
  styleUrl: './direction.component.css'
})
export class DirectionComponent implements OnInit {

  departements: string[] = [];
  projets: ProjetDirection[] = [];
  /** null : tous les départements. */
  departement: string | null = null;

  chargement = true;
  erreur = false;

  /** Projets dépliés, et ceux déjà chargés une fois (replier ne recharge pas). */
  private readonly deplies = new Set<number>();
  private readonly dejaCharges = new Set<number>();

  constructor(private directionService: DirectionService) {
  }

  ngOnInit(): void {
    this.directionService.projets().subscribe({
      next: ({departements, projets}) => {
        this.departements = departements;
        this.projets = projets;
        this.chargement = false;
      },
      error: () => {
        this.chargement = false;
        this.erreur = true;
      }
    });
  }

  choisir(departement: string | null): void {
    this.departement = departement;
  }

  get projetsAffiches(): ProjetDirection[] {
    return this.departement == null
      ? this.projets
      : this.projets.filter(p => p.departement === this.departement);
  }

  /**
   * Avancement global des projets affichés : moyenne de leur avancement,
   * pondérée par leur nombre de tâches (un gros projet pèse plus qu'un petit).
   */
  get avancementGlobal(): number {
    const projets = this.projetsAffiches;
    const taches = projets.reduce((total, p) => total + p.nombreTaches, 0);
    if (!taches) {
      return 0;
    }
    const pondere = projets.reduce((total, p) => total + p.avancement * p.nombreTaches, 0);
    return Math.round(pondere / taches);
  }

  get nombreTachesAffichees(): number {
    return this.projetsAffiches.reduce((total, p) => total + p.nombreTaches, 0);
  }

  get nombreRetardsAffiches(): number {
    return this.projetsAffiches.reduce((total, p) => total + p.tachesEnRetard, 0);
  }

  nombreProjets(departement: string | null): number {
    return departement == null
      ? this.projets.length
      : this.projets.filter(p => p.departement === departement).length;
  }

  basculer(p: ProjetDirection): void {
    if (this.deplies.has(p.id)) {
      this.deplies.delete(p.id);
    } else {
      this.deplies.add(p.id);
      this.dejaCharges.add(p.id);
    }
  }

  estDeplie(p: ProjetDirection): boolean {
    return this.deplies.has(p.id);
  }

  dejaDeplie(p: ProjetDirection): boolean {
    return this.dejaCharges.has(p.id);
  }

  parId(_: number, p: ProjetDirection): number {
    return p.id;
  }
}
