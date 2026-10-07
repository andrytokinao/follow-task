import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {filter, Subscription} from 'rxjs';
import {ContexteDonnees, DirectionService} from './direction.service';
import {FiltresDirection, PeriodeDirection} from './direction.model';

export interface DirectionMenu {
  label: string;
  description: string;
  icon: string;
  route: string;
  /** Écran prévu mais pas encore livré : visible, marqué « Bientôt ». */
  bientot?: boolean;
}

/**
 * Shell du cockpit de direction : navigation latérale, barre de filtres
 * commune et zone de contenu.
 *
 * Ce n'est pas un espace de travail : il lit tous les projets à la fois et ne
 * modifie rien. Pour agir sur une tâche, on repart vers son espace.
 */
@Component({
  standalone: false,
  selector: 'app-direction',
  templateUrl: './direction.component.html',
  styleUrl: './direction.component.css'
})
export class DirectionComponent implements OnInit, OnDestroy {

  collapsed = false;
  titre = '';
  sousTitre = '';
  filtres: FiltresDirection;

  /** Alimenté par les réponses des écrans : le shell n'interroge pas le serveur lui-même. */
  contexte: ContexteDonnees = {departements: [], miseAJour: null};

  readonly periodes: { valeur: PeriodeDirection; libelle: string }[] = [
    {valeur: 'semaine', libelle: 'Semaine'},
    {valeur: 'mois', libelle: 'Mois'},
    {valeur: 'trimestre', libelle: 'Trimestre'}
  ];

  readonly menus: DirectionMenu[] = [
    {label: 'Vue d\'ensemble', description: 'Indicateurs et décisions', icon: 'fas fa-chart-pie', route: 'overview'},
    {label: 'Projets', description: 'Portefeuille et livrables', icon: 'fas fa-briefcase', route: 'projets', bientot: true},
    {label: 'Équipes', description: 'Charge par personne', icon: 'fas fa-users', route: 'equipes', bientot: true},
    {label: 'Départements', description: 'Comparaison des pôles', icon: 'fas fa-sitemap', route: 'departements', bientot: true},
    {label: 'Activités internes', description: 'Tâches hors mission', icon: 'fas fa-building', route: 'activites', bientot: true}
  ];

  private abonnements = new Subscription();

  constructor(private directionService: DirectionService,
              private router: Router,
              private route: ActivatedRoute) {
    this.filtres = directionService.filtres;
  }

  ngOnInit(): void {
    this.abonnements.add(this.directionService.filtres$.subscribe(f => this.filtres = f));
    this.abonnements.add(this.directionService.contexte$.subscribe(c => this.contexte = c));
    this.lireEntete();
    this.abonnements.add(this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.lireEntete()));
  }

  ngOnDestroy(): void {
    this.abonnements.unsubscribe();
  }

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
  }

  changerDepartement(valeur: string): void {
    this.directionService.changerFiltres({departement: valeur || null});
  }

  changerPeriode(periode: PeriodeDirection): void {
    this.directionService.changerFiltres({periode});
  }

  /** Titre et sous-titre de l'écran affiché, déclarés dans les données de route. */
  private lireEntete(): void {
    let courant = this.route;
    while (courant.firstChild) {
      courant = courant.firstChild;
    }
    const data = courant.snapshot.data;
    this.titre = data['titre'] ?? '';
    this.sousTitre = data['sousTitre'] ?? '';
  }
}
