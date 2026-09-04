import {Component, Input, OnChanges} from '@angular/core';
import {
  decouperRepartition,
  PartRepartition,
  RapportCompositeDTO,
  RapportEquipeDTO,
  RapportProjetDTO,
  TempsParPersonneDTO
} from '../../../../../type/rapport';

/** Une équipe et le découpage de son anneau, prêts à afficher. */
interface EquipeAffichee {
  equipe: RapportEquipeDTO;
  parts: PartRepartition[];
}

/**
 * Aperçu d'un rapport composé.
 *
 * Le document n'invente rien : chaque partie est rendue par le composant qui la
 * rendrait seule — `app-rapport-projet` pour un projet, `app-rapport-personne`
 * pour une personne. Un projet dit donc ici exactement ce qu'il dit dans son
 * rapport individuel, comme du côté serveur où les mêmes fragments Thymeleaf
 * sont réutilisés.
 *
 * Les sections absentes du rapport valent `null` : « aucun projet sélectionné »
 * et « les projets sélectionnés n'ont rien à montrer » sont deux situations
 * différentes, et l'affichage ne doit pas les confondre.
 */
@Component({
  standalone: false,
  selector: 'app-rapport-composite',
  templateUrl: './rapport-composite.component.html',
  styleUrl: './rapport-composite.component.css'
})
export class RapportCompositeComponent implements OnChanges {

  @Input({required: true}) rapport!: RapportCompositeDTO;

  /** Anneau de la synthèse des projets : le temps par intervenant, tous projets confondus. */
  partsProjets: PartRepartition[] = [];

  /** Anneau de la synthèse par personne. */
  partsPersonnes: PartRepartition[] = [];

  equipes: EquipeAffichee[] = [];

  readonly rayon = 100 / (2 * Math.PI);

  ngOnChanges(): void {
    this.partsProjets = this.decouper(this.rapport?.projets?.synthese?.repartitionParPersonne);
    this.partsPersonnes = this.decouper(this.rapport?.personnes?.synthese?.repartitionParPersonne);
    this.equipes = (this.rapport?.equipes ?? []).map(equipe => ({
      equipe,
      parts: this.decouper(equipe.synthese?.repartitionParPersonne)
    }));
  }

  /** Seuils visuels, identiques à ceux du template serveur. */
  classeBarre(pourcentage: number): string {
    if (pourcentage < 40) {
      return 'barre-rouge';
    }
    return pourcentage < 75 ? 'barre-orange' : 'barre-verte';
  }

  /**
   * Couleur d'un pourcentage dans le sommaire : mêmes seuils que les barres de
   * progression, pour qu'un chiffre et une barre ne racontent jamais deux
   * choses différentes.
   */
  classeValeur(pourcentage: number): string {
    if (pourcentage < 40) {
      return 'valeur-faible';
    }
    return pourcentage < 75 ? 'valeur-moyenne' : 'valeur-forte';
  }

  /** Suivi par rang : deux projets peuvent porter le même nom, qui ne fait pas une clé. */
  suiviProjet(index: number, _projet: RapportProjetDTO): number {
    return index;
  }

  suiviEquipe(index: number, equipe: EquipeAffichee): number {
    return equipe.equipe.equipeId ?? index;
  }

  /** Le rapport a-t-il quelque chose à montrer ? */
  get vide(): boolean {
    return !this.rapport?.projets
      && !this.rapport?.personnes
      && !(this.rapport?.equipes?.length);
  }

  private decouper(repartition: TempsParPersonneDTO[] | undefined | null): PartRepartition[] {
    return decouperRepartition((repartition ?? []).map(part => ({
      nom: part.nomPersonne,
      heures: part.heuresPassees,
      pourcentage: part.pourcentageDuTemps
    })));
  }
}
