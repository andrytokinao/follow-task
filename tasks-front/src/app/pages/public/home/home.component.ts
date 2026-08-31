import {AfterViewInit, Component, ElementRef, HostListener, OnDestroy} from '@angular/core';
import {Router} from "@angular/router";

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements AfterViewInit, OnDestroy {

  /** Passe l'en-tête en fond opaque dès qu'on quitte le haut du héros. */
  scrolled = false;

  /** Tiroir de navigation mobile. */
  menuOpen = false;

  year = new Date().getFullYear();

  private observer?: IntersectionObserver;

  constructor(
    private router: Router,
    private host: ElementRef<HTMLElement>,
  ) {
  }

  stats = [
    {value: '6 vues', label: 'Kanban, liste, calendrier, Gantt, planning et rapports'},
    {value: 'Temps réel', label: 'Messages et notifications sans rechargement'},
    {value: 'Sur mesure', label: 'Statuts, champs et rôles propres à chaque projet'},
    {value: 'Web & mobile', label: 'Le même espace de travail sur tous les écrans'},
  ];

  features = [
    {
      icon: 'fa-table-columns',
      title: 'Tableau Kanban',
      description: 'Faites glisser les tâches d\'une colonne à l\'autre et lisez l\'état du projet en un coup d\'œil.',
    },
    {
      icon: 'fa-chart-gantt',
      title: 'Planning et Gantt',
      description: 'Jalons, durées et dépendances sur une même frise, pour anticiper les retards avant qu\'ils arrivent.',
    },
    {
      icon: 'fa-users-gear',
      title: 'Répartition de charge',
      description: 'Voyez qui est disponible, qui sature, et rééquilibrez le travail en quelques clics.',
    },
    {
      icon: 'fa-comments',
      title: 'Messagerie intégrée',
      description: 'Chaque échange reste rattaché à sa tâche : plus de décision perdue au fond d\'une boîte mail.',
    },
    {
      icon: 'fa-folder-open',
      title: 'Documents centralisés',
      description: 'Plans, devis et livrables partagés au bon endroit, avec l\'historique des versions.',
    },
    {
      icon: 'fa-chart-pie',
      title: 'Rapports et statistiques',
      description: 'Temps passé, taux d\'avancement, écarts au planning : les chiffres se calculent tout seuls.',
    },
  ];

  sectors = [
    {
      image: 'assets/images/work-space/btp.jpg',
      title: 'BTP et chantiers',
      description: 'Lots, corps de métier et avancement terrain suivis jour après jour.',
    },
    {
      image: 'assets/images/work-space/equipe-dev.jpg',
      title: 'Équipes techniques',
      description: 'Sprints, tickets et revues dans un flux de travail que vous définissez.',
    },
    {
      image: 'assets/images/work-space/topo.jpg',
      title: 'Bureaux d\'études',
      description: 'Missions, relevés et livrables classés par projet et par client.',
    },
    {
      image: 'assets/images/work-space/comptabilite.png',
      title: 'Administratif et finance',
      description: 'Échéances, validations et pièces justificatives sous contrôle.',
    },
    {
      image: 'assets/images/work-space/montage-video.png',
      title: 'Production et création',
      description: 'Étapes de production, retours client et versions au même endroit.',
    },
    {
      image: 'assets/images/work-space/controle-equipe.jpg',
      title: 'Pilotage d\'équipe',
      description: 'Objectifs, charge et disponibilités visibles par tous les responsables.',
    },
  ];

  steps = [
    {
      title: 'Créez votre projet',
      description: 'Nommez-le, définissez ses statuts et ses champs. Quelques minutes suffisent.',
    },
    {
      title: 'Invitez votre équipe',
      description: 'Attribuez les rôles, répartissez les tâches et fixez les échéances.',
    },
    {
      title: 'Suivez l\'avancement',
      description: 'Tableaux, plannings et rapports se mettent à jour au fil du travail réel.',
    },
  ];

  /** Maquette d'aperçu du héros — contenu purement illustratif. */
  mockBoard = [
    {
      title: 'À faire',
      color: '#94a3b8',
      cards: [
        {tag: 'Étude', progress: 15, avatars: ['#1565c0', '#f59e0b']},
        {tag: 'Achat', progress: 0, avatars: ['#8b5cf6']},
      ],
    },
    {
      title: 'En cours',
      color: '#1565c0',
      cards: [
        {tag: 'Chantier', progress: 62, avatars: ['#0ea5e9', '#22c55e', '#ef4444']},
        {tag: 'Contrôle', progress: 40, avatars: ['#f59e0b']},
      ],
    },
    {
      title: 'Terminé',
      color: '#22c55e',
      cards: [
        {tag: 'Livraison', progress: 100, avatars: ['#22c55e', '#1565c0']},
      ],
    },
  ];

  // ---------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------

  start() {
    this.closeMenu();
    this.router.navigate(["/login"]);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  /**
   * Défilement doux vers une section. Le href reste posé sur le lien pour
   * l'accessibilité et le clic milieu ; on intercepte seulement le clic simple.
   */
  goTo(event: Event, id: string) {
    const target = document.getElementById(id);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
    this.closeMenu();
  }

  scrollToTop() {
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 24;
  }

  // ---------------------------------------------------------------------
  // Apparition progressive des sections
  // ---------------------------------------------------------------------

  ngAfterViewInit(): void {
    const targets = this.host.nativeElement.querySelectorAll<HTMLElement>('.reveal');

    // Sans IntersectionObserver (navigateurs anciens), on affiche tout
    // immédiatement plutôt que de laisser la page vide.
    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }

    this.observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target); // une seule apparition par section
          }
        });
      },
      {threshold: 0.12, rootMargin: '0px 0px -40px 0px'},
    );

    targets.forEach(el => this.observer!.observe(el));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
