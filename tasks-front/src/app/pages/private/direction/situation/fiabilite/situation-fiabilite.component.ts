import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {Apparence, Fiabilite, NIVEAUX, Ton} from '../situation.model';

/**
 * Bande 1 : peut-on croire ce qu'on lit ? Affichée avant les chiffres : la
 * situation ne vaut que ce que vaut le planning.
 *
 * Pendant les heures de travail, la part des ouvriers dont le planning dit ce
 * qu'ils font maintenant ; en dehors, le remplissage du planning de la journée.
 */
@Component({
  standalone: false,
  selector: 'app-situation-fiabilite',
  templateUrl: './situation-fiabilite.component.html',
  styleUrl: './situation-fiabilite.component.css'
})
export class SituationFiabiliteComponent implements OnChanges {

  @Input({required: true}) fiabilite!: Fiabilite;
  /** Vrai si la liste des personnes est réduite à celles sans planning. */
  @Input() filtreActif = false;
  @Output() basculerFiltre = new EventEmitter<void>();

  valeur = '';
  titre = '';
  detail = '';
  niveau: Apparence | null = null;
  ton: Ton = 'neutre';
  /** Personnes dont on ne sait pas ce qu'elles font maintenant. */
  sansPlanning = 0;

  ngOnChanges(): void {
    const f = this.fiabilite;
    this.niveau = f.niveau ? NIVEAUX[f.niveau] : null;
    this.ton = this.niveau?.ton ?? 'neutre';
    this.sansPlanning = f.enHoraires ? f.ouvriers - f.planningAJour : 0;

    if (f.part == null) {
      this.valeur = '—';
      this.titre = f.ouvriers ? 'Rien à mesurer pour le moment' : 'Aucun ouvrier suivi ici';
      this.detail = 'Les ouvriers sont les personnes assignables d\'un espace qui n\'y encadrent pas.';
      return;
    }
    if (f.enHoraires) {
      this.valeur = `${f.planningAJour} / ${f.ouvriers}`;
      this.titre = `ouvriers ont un planning à jour (${f.part} %)`;
      this.detail = this.sansPlanning
        ? `${this.sansPlanning} personne(s) sans planning en ce moment : leur activité est inconnue, pas forcément absente.`
        : 'Chacun a renseigné ce qu\'il fait en ce moment.';
    } else {
      this.valeur = `${f.part} %`;
      this.titre = f.remplissageJour != null
        ? 'du planning de la journée est rempli'
        : 'du planning du dernier jour ouvrable est rempli';
      this.detail = 'Hors des heures de travail : personne n\'a à être en activité maintenant.';
    }
    if (f.remplissageVeille != null && f.remplissageJour != null) {
      this.detail += ` Dernier jour ouvrable : planning rempli à ${f.remplissageVeille} %.`;
    }
  }
}
