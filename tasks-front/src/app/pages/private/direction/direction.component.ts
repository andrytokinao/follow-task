import {Component, OnInit} from '@angular/core';
import {DirectionService} from './direction.service';
import {ProjetDirection} from './direction.model';

/**
 * Cockpit de direction : les projets en cours de la société, rangés par
 * département (onglets en haut).
 *
 * À gauche, le menu des projets ; à droite, la fiche du projet choisi
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
export class DirectionComponent implements OnInit {

  departements: string[] = [];
  projets: ProjetDirection[] = [];
  /** null : tous les départements. */
  departement: string | null = null;

  chargement = true;
  erreur = false;

  selection: ProjetDirection | null = null;

  constructor(private directionService: DirectionService) {
  }

  ngOnInit(): void {
    this.directionService.projets().subscribe({
      next: ({departements, projets}) => {
        this.departements = departements;
        this.projets = projets;
        this.chargement = false;
        this.choisirPremier();
      },
      error: () => {
        this.chargement = false;
        this.erreur = true;
      }
    });
  }

  choisir(departement: string | null): void {
    this.departement = departement;
    if (!this.selection || !this.projetsAffiches.includes(this.selection)) {
      this.choisirPremier();
    }
  }

  get projetsAffiches(): ProjetDirection[] {
    return this.departement == null
      ? this.projets
      : this.projets.filter(p => p.departement === this.departement);
  }

  nombreProjets(departement: string | null): number {
    return departement == null
      ? this.projets.length
      : this.projets.filter(p => p.departement === departement).length;
  }

  choisirProjet(p: ProjetDirection): void {
    this.selection = p;
  }

  parId(_: number, p: ProjetDirection): number {
    return p.id;
  }

  private choisirPremier(): void {
    this.selection = this.projetsAffiches[0] ?? null;
  }
}
