import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {Icone} from "../../../type/issue";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {CategorieIcones, construireCategories, IconeChoix, rechercherIcones} from "./catalogue-icones.util";

/**
 * Choix d'une icône parmi toutes les icônes gratuites de Font Awesome,
 * rangées par catégorie. Le catalogue (scripts/generer-catalogue-icones.cjs)
 * est chargé à l'ouverture, hors du paquet principal.
 */
@Component({
  selector: 'app-choose-dialog',
  standalone: true,
    imports: [
        NgForOf,
        NgIf,
        FormsModule,
    ],
  templateUrl: './choose-dialog.component.html',
  styleUrl: './choose-dialog.component.css'
})
export class ChooseDialogComponent implements OnInit {
  @Output() iconSelected:EventEmitter<Icone> = new EventEmitter<Icone>();
  /** Affiché dans un mat-menu et non dans une modale : pas d'en-tête. */
  @Input() enMenu = false;
  constructor(
    public activeModal: NgbActiveModal,
    ) {}

  categories: CategorieIcones[] = [];
  categorieChoisie: CategorieIcones | undefined;
  saisie = '';
  /** Résultat de la recherche : un champ, pas un getter, pour le *ngFor. */
  resultats: IconeChoix[] = [];

  ngOnInit(): void {
    import('./catalogue-icones.data').then(({ICONES_FA, CATEGORIES_FA}) => {
      this.categories = construireCategories(ICONES_FA, CATEGORIES_FA);
      this.categorieChoisie = this.categories[0];
    });
  }

  choisirCategorie(categorie: CategorieIcones) {
    this.categorieChoisie = categorie;
    this.saisie = '';
    this.resultats = [];
  }

  rechercher() {
    this.resultats = rechercherIcones(this.categories, this.saisie);
  }

  /** Icônes affichées : la recherche en cours, sinon la catégorie choisie. */
  iconesAffichees(): IconeChoix[] {
    return this.saisie.trim() ? this.resultats : (this.categorieChoisie?.icones ?? []);
  }

  selectIcon(icon: IconeChoix){
    // Seuls les champs de l'entité Icone partent au serveur.
    const icone: any = {typeIcone: icon.typeIcone, value: icon.value, id: icon.id};
    this.iconSelected.emit(icone);
    this.activeModal.close({ icone });
  }

}
