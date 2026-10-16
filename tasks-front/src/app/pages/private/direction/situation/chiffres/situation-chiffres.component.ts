import {Component, Input, OnChanges} from '@angular/core';
import {ChiffresProjets, lienDemande, ProjetATraiter} from '../situation.model';

/** Un projet de la liste « À traiter », prêt à afficher. */
interface LigneATraiter {
  projet: ProjetATraiter;
  lien: string[] | null;
  detail: string;
}

/**
 * Bande 2 : où en est-on ? Quatre chiffres des projets en cours, et seulement
 * les exceptions : les projets en retard ou bloqués, cinq au plus. Mêmes
 * chiffres que le cockpit, le serveur les tire des mêmes rapports.
 */
@Component({
  standalone: false,
  selector: 'app-situation-chiffres',
  templateUrl: './situation-chiffres.component.html',
  styleUrl: './situation-chiffres.component.css'
})
export class SituationChiffresComponent implements OnChanges {

  @Input({required: true}) chiffres!: ChiffresProjets;
  @Input() aTraiter: ProjetATraiter[] = [];

  lignes: LigneATraiter[] = [];

  ngOnChanges(): void {
    this.lignes = this.aTraiter.map(projet => ({
      projet,
      lien: lienDemande(projet.prefixeDepartement, projet.cle),
      detail: detail(projet)
    }));
  }

  parId(_: number, ligne: LigneATraiter): number {
    return ligne.projet.id;
  }
}

function detail(p: ProjetATraiter): string {
  const parts: string[] = [];
  if (p.tachesEnRetard) {
    parts.push(`${p.tachesEnRetard} tâche(s) en retard`);
  }
  if (p.tachesBloquees) {
    parts.push(`${p.tachesBloquees} bloquée(s)`);
  }
  parts.push(`${p.avancement} %`);
  return parts.join(' · ');
}
