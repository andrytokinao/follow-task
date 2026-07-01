import { Component, OnInit, OnDestroy } from '@angular/core';
import { IssueService } from "../../../services/issue.service";
import { Project } from "../../../type/issue";
import { Router } from "@angular/router";
import { AuthService } from "../../../services/auth.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UserService } from "../../../services/user.service";
import { AuthGuard } from "../../../services/SystemGuard";
import { PopupCreateProjectComponent } from "../popup-create-project/popup-create-project.component";

interface Slide {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  projects: Project[] = [];
  isLoading = false;
  loadingMessage = 'Veuillez patienter';
  searchTerm = '';

  // Slider
  currentSlide = 0;
  slides: Slide[] = [
    {
      id: 'kanban',
      title: 'Gestion des tâches',
      desc: 'Kanban en temps réel pour toute l\'équipe',
      icon: 'fa-columns',
      color: '#6366F1'
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp intégré',
      desc: 'Archivez automatiquement messages et fichiers',
      icon: 'fa-whatsapp',
      color: '#128C7E'
    },
    {
      id: 'storage',
      title: 'Stockage centralisé',
      desc: 'Tous vos fichiers classés par groupe et projet',
      icon: 'fa-folder',
      color: '#0EA5E9'
    },
    {
      id: 'analytics',
      title: 'Reporting temps réel',
      desc: 'Métriques et activité de vos équipes',
      icon: 'fa-bar-chart',
      color: '#7C3AED'
    }
  ];

  chartBars = [
    { day: 'L', val: 55 },
    { day: 'M', val: 80 },
    { day: 'M', val: 45 },
    { day: 'J', val: 90 },
    { day: 'V', val: 75 },
    { day: 'S', val: 30 },
    { day: 'D', val: 60 }
  ];

  // Stats animées
  animatedProjectCount = 0;
  animatedMessages = 0;
  animatedUptime = 0;

  private readonly AVATAR_COLORS = [
    '#6366F1', '#8B5CF6', '#0EA5E9', '#10B981',
    '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'
  ];

  private sliderInterval: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private modalService: NgbModal,
    protected issueService: IssueService,
    protected userService: UserService,
    protected authGuard: AuthGuard
  ) {}

  ngOnInit(): void {
    this.issueService.projects$.subscribe(projects => {
      this.projects = projects;
      this.animateCounter('animatedProjectCount', projects.length);
    });
    this.animateCounter('animatedMessages', 1240);
    this.animateCounter('animatedUptime', 99);
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  // ── Slider ──
  private startAutoSlide(): void {
    this.sliderInterval = setInterval(() => this.nextSlide(), 4500);
  }

  private stopAutoSlide(): void {
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
    }
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  // ── Projets ──
  get filteredProjects(): Project[] {
    if (!this.searchTerm.trim()) return this.projects;
    const term = this.searchTerm.toLowerCase();
    return this.projects.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.prefix?.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term)
    );
  }

  getAvatarColor(prefix: String): string {
    if (!prefix) return this.AVATAR_COLORS[0];
    return this.AVATAR_COLORS[prefix.charCodeAt(0) % this.AVATAR_COLORS.length];
  }

  private animateCounter(
    prop: 'animatedProjectCount' | 'animatedMessages' | 'animatedUptime',
    target: number,
    duration = 1200
  ): void {
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      (this as any)[prop] = Math.round(target * ease);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  selectProject(project: Project): void {
    this.isLoading = true;
    this.loadingMessage = `Ouverture de « ${project.name} »`;
    this.router.navigate(['/working/' + project.prefix + '/list/master']);
  }

  createProject(): void {
    const dialogRef = this.modalService.open(PopupCreateProjectComponent);
    dialogRef.result.then(() => {
      this.issueService.loadProjectList();
    }).catch(() => {});
  }
}
