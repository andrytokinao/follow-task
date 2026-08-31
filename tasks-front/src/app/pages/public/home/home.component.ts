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
    {value: 'Temps réel', label: 'Agendas et avancement mis à jour en direct, sans rafraîchir'},
    {value: 'WhatsApp', label: 'Le groupe du projet raccordé, ses messages convertis en missions'},
    {value: 'Multi-espaces', label: 'Un espace de travail par département de votre société'},
    {value: 'Accès client', label: 'Le donneur d\'ordre suit son projet en lecture seule'},
  ];

  features = [
    {
      icon: 'fa-satellite-dish',
      title: 'Qui fait quoi, en direct',
      description: 'Les agendas de toute l\'équipe se mettent à jour en temps réel. Vous voyez qui est sur quoi à l\'instant même, sans réunion de point ni relance.',
    },
    {
      icon: 'fa-list-check',
      title: 'Planning de journée et auto-évaluation',
      description: 'Chacun planifie sa journée, puis rend compte lui-même : terminé, bloqué, reporté ou prolongé — avec le pourcentage d\'avancement et le motif.',
    },
    {
      icon: 'fa-wand-magic-sparkles',
      title: 'Le message devient une mission',
      description: 'Groupe WhatsApp raccordé ou canal interne : au lieu de laisser passer un message, transformez-le en mission assignée, datée et suivie.',
    },
    {
      icon: 'fa-user-tie',
      title: 'Votre client suit son projet',
      description: 'Quand le projet le justifie, ouvrez un accès en lecture au client. Il voit l\'avancement réel quand il veut, au lieu de vous appeler pour le demander.',
    },
    {
      icon: 'fa-sitemap',
      title: 'Un espace par département',
      description: 'Créez autant d\'espaces de travail que de départements. Chacun garde ses projets, ses membres et ses règles, sous une même organisation.',
    },
    {
      icon: 'fa-clock-rotate-left',
      title: 'Tout reste traçable',
      description: 'Message d\'origine, document, décision, temps passé : chaque mission garde son historique complet et alimente les rapports toute seule.',
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
      title: 'Ouvrez votre espace',
      description: 'Un espace de travail par département, et vos projets à l\'intérieur. Quelques minutes suffisent.',
    },
    {
      title: 'Raccordez votre canal',
      description: 'Branchez le groupe WhatsApp du projet, invitez l\'équipe, ouvrez l\'accès au client si besoin.',
    },
    {
      title: 'Transformez et suivez',
      description: 'Les messages deviennent des missions ; agendas, avancement et rapports se mettent à jour tout seuls.',
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
