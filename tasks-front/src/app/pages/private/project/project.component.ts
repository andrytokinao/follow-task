import {AfterViewInit, Component, HostListener, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Route, Router, RouterOutlet} from "@angular/router";
import {IssueService} from "../../../services/issue.service";
import {Breadcrumb, Issue, NotificationApp, Project, User} from "../../../type/issue";
import {AuthGuard} from "../../../services/SystemGuard";
import {NewIssueComponent} from "./modal/new-issue/new-issue.component";
import {stripTypename} from "@apollo/client/utilities";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ViewEditIssueComponent} from "./modal/view-edit-issue/view-edit-issue.component";
import {BreadcrumbService} from "../../../services/breadcrumb.service";
import {UserService} from "../../../services/user.service";
import {ProjectGuard} from "../../../services/ProjectGuard";
import {MatButton} from "@angular/material/button";
import {routeTransition} from "../../../../route-transition";
import {animate, keyframes, state, style, transition, trigger, useAnimation} from "@angular/animations";
import {
  fromBottomEasing,
  fromTopEasing,
  moveFromLeft, rotateGlueFromBottom,
  rotateGlueFromTop
} from "../../../../../projects/router-animations/src/lib/router-animations";
import formatters from "chart.js/dist/core/core.ticks";
import {ProjectBreadcrumbResolverService} from "./project-breadcrumb-resolver.service";
import {MessagesService} from "../../../services/messages.service";
import {filter} from "rxjs";
import {ProfileComponent} from "../profile/profile.component";
import {AuthService} from "../../../services/auth.service";
import {LayoutService} from "../../../services/layout.service";
import {NotificationService} from "../../../services/notification.service";

@Component({
  selector: 'app-project',
  standalone: false,
  templateUrl: './project.component.html',
  styleUrl: './project.component.css',
  animations: [
    trigger('workspace', [
      transition('* => end', [
        animate('0.8s 0s ease', keyframes([
          style({ opacity: '0.3', transform: 'translateX(-10%) rotateY(90deg)', offset: 0}),
          style({opacity: '1', transform: 'translateX(0%) rotateY(0deg)', offset: 1 })
        ]))
      ]),
    ]),
    trigger('routeAnimations', [
      transition(':decrement', useAnimation(rotateGlueFromTop)),
      transition(':increment', useAnimation(rotateGlueFromBottom))
    ]),
  ]

})
export class ProjectComponent implements OnInit{
  sidebarCollapsed: boolean = false;
  drawerOpen: boolean = false;
  bottomSheetOpen: boolean = false;

  toggleDrawer() { this.drawerOpen = !this.drawerOpen; }
  closeDrawer() { this.drawerOpen = false; }

  openBottomSheet() { this.bottomSheetOpen = true; }
  closeBottomSheet() { this.bottomSheetOpen = false; }

  // ---------------------------------------------------------------------
  // Barre superieure mobile : effacement au defilement
  // ---------------------------------------------------------------------

  /** Tolerance avant de considerer la page comme defilee : le rebond elastique
   *  des navigateurs mobiles renvoie quelques pixels parasites en haut de
   *  course. */
  private static readonly TOLERANCE = 8;

  /**
   * La barre n'est visible qu'en haut de page. Les sous-menus des pages
   * s'epinglent au bord superieur de l'ecran : les laisser cohabiter les ferait
   * se recouvrir, puisqu'ils viseraient la meme hauteur. Des le premier geste
   * de defilement la barre s'efface donc et rend le bord au sous-menu ; elle
   * revient quand on est remonte tout en haut.
   *
   * Pas de « reapparition au defilement vers le haut » : elle recouvrirait le
   * sous-menu deja epingle a 0.
   */
  topbarCachee = false;

  @HostListener('window:scroll')
  onDefilement(): void {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    this.topbarCachee = y > ProjectComponent.TOLERANCE;
  }
  openBottomSheetFromDrawer() {
    this.closeDrawer();
    setTimeout(() => this.openBottomSheet(), 180);
  }  workSpace='';
  activeRouteName: string = '';
  connectedUser: User | undefined;

  private routeNames: Record<string, string> = {
    'list': 'Liste',
    'tasks': 'Tâches',
    'calendar': 'Calendrier',
    'planning': 'Planning',
    'config': 'Config',
  };
  project:Project | undefined;
  private issues: Issue[]=[];
  breadcrumbs: Breadcrumb[] = [];
  openConfig:boolean = false;
  openList:boolean = true;
  projects:Project[]= [];
  isworkspace: Boolean = false;
  protected buttonTriger: string  ='Loading';
  private previousOrder: number;
  private projectBreadcrumb: Breadcrumb;

  constructor(
    protected route:ActivatedRoute,
    protected issueService:IssueService,
    protected authGuard:AuthGuard,
    private modalService: NgbModal,
    private router: Router,
    protected userService:UserService,
    private breadcrumbService: BreadcrumbService,
    protected projectGuard:ProjectGuard,
    private breadcrumb:ProjectBreadcrumbResolverService,
    private messagesService:MessagesService,
    protected authService: AuthService,
    protected layout: LayoutService,
    private notificationService: NotificationService
  ) {
  }

  // ---------------------------------------------------------------------
  // Pastilles de notification
  // ---------------------------------------------------------------------

  /** Non lues par projet, alimentees par l'unique observable du front. */
  private nonLuesParProjet = new Map<number, NotificationApp[]>();
  private static readonly AUCUNE: NotificationApp[] = [];

  /**
   * Nombre de notifications non lues du projet ouvert. La meme valeur marque
   * le menu Projets et le menu Taches : les deux menent aux memes taches, et
   * l'utilisateur peut arriver par l'un ou par l'autre.
   */
  get nonLuesDuProjet(): number {
    return this.nonLuesPourProjet(this.project);
  }

  /** Pour le selecteur de workspace : quel autre projet reclame une visite. */
  nonLuesPourProjet(project: Project | undefined): number {
    return this.detailsPourProjet(project).length;
  }

  private detailsPourProjet(project: Project | undefined): NotificationApp[] {
    const id = project?.id;
    if (id == null) {
      return ProjectComponent.AUCUNE;
    }
    return this.nonLuesParProjet.get(Number(id)) ?? ProjectComponent.AUCUNE;
  }

  /**
   * Ce que la pastille du menu annonce, en clair. Sans cela le menu Taches
   * portait un nombre sans objet : impossible de savoir, sans ouvrir la liste,
   * s'il s'agissait d'une affectation ou d'un passage de « En attente » a
   * « En cours ».
   */
  resumeDuProjet(project?: Project): string {
    return this.notificationService.resumeTexte(
      this.detailsPourProjet(project ?? this.project), 'Nouveautes sur vos taches :');
  }

  /**
   * Le chevron rouge du menu Projets mene a la liste des taches : c'est la que
   * se trouve ce qui vient d'etre assigne. Cliquer dessus ne marque rien comme
   * lu — c'est l'ouverture de la tache qui le fera, sinon la pastille
   * s'eteindrait avant meme d'avoir montre ce qu'elle annoncait.
   */
  allerAuxTaches() {
    this.closeDrawer();
    if (!this.project) {
      return;
    }
    // Filtres ouverts en grand : les valeurs par defaut de la liste (mes
    // taches, statuts non clos) pourraient masquer la ligne qu'on annonce, et
    // le chevron menerait a une page vide.
    this.router.navigate(['/working', this.project.prefix, 'tasks'],
      {queryParams: {statut: 'tous', assigne: 'tous', vue: 'table'}});
  }



  private editIssue(issue) {
    this.issueService.openEditIssue(issue);
  }
  toggleList() {
    this.openList = !this.openList;
  }

  toggleConfig() {
    this.openConfig = !this.openConfig;
  }
  selectProject(project: Project) {
    this.workSpace = project.prefix.toString();
    this.project = project;
    if (true)
      this.router.navigate(["/working/" + project.prefix + "/projects/master"]);

    const currentUrl = this.router.url;
    const [path, query] = currentUrl.split('?');
    const segments = path.split('/').filter(s => s.length > 0); // enlève les "" dus au split

    const workingIdx = segments.indexOf('working');

    // segments après "working/{prefix}/"
    const rest = workingIdx !== -1 ? segments.slice(workingIdx + 2) : [];

    if (workingIdx !== -1 && rest.length === 1) {
      segments[workingIdx + 1] = project.prefix.toString();
      this.router.navigateByUrl('/' + segments.join('/') + (query ? '?' + query : ''));
    } else {
      this.router.navigate(["/working/" + project.prefix + "/projects/master"]);
    }
  }

  triggerAnimation() {
    this.issueService.nextIsLoadingWorkspace( !this.isworkspace);
    if(this.isworkspace)
      this.buttonTriger = "Loeded";
    else
      this.buttonTriger = "Loading";
  }
  getAnimationState(o: any) {
    //if (!this.projectBreadcrumb) {
    //  return '';
    //}
    return  o.activatedRouteData['order'] ;
   // const stat =  routeOrder >= this.projectBreadcrumb.order ? 'top' :'bottom';
   // return stat;
  }

  ngOnInit(): void {

    // Le repli vient du service : la fleche de la sidebar et le bouton du
    // calendrier pilotent le meme etat, et la preference est restauree au
    // chargement.
    this.layout.sidebarReduite$.subscribe(reduite => {
      this.sidebarCollapsed = reduite;
    });

    this.issueService.loadedWorkspace$.subscribe(value => {
      this.isworkspace = value.valueOf();
    });
    this.notificationService.unreadDetailsByProject$.subscribe(details => {
      this.nonLuesParProjet = details;
    });
    this.authService.connectedUser$.subscribe(user => {
      this.connectedUser = user;
    });
    this.route.data.subscribe(data => {
      console.debug(data);
      const breadcrumb: Breadcrumb[] = data['breadcrumb'];
      this.project = data['project'];
      this.previousOrder = data['order']
      /* console.debug(breadcrumb);
       this.breadcrumbService.setBreadcrumbs(breadcrumb);
       this.breadcrumbs = breadcrumb;
       this.breadcrumbService.setBreadcrumbs(breadcrumb);*/
    });
    this.route.data.subscribe(data=> {
      this.previousOrder = data['order'];
      console.log('orrrder ',this.previousOrder);
    })
    this.route.data.subscribe(data => {
      let path = this.route.snapshot.pathFromRoot;
      console.log(path);
    });
    this.issueService.project$.subscribe(project => {
      this.project = project;
      if (this.project) {
        this.userService.loadGroupeUserForProject(this.project.prefix);
      }
    });

    this.issueService.projects$.subscribe(projectes => {
      this.projects = projectes;
    });
    this.breadcrumb.curentBreadcrumb$.subscribe(b => {
      this.projectBreadcrumb = b;
    });
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const segments = this.router.url.split('/');
      const last = segments[segments.length - 1];
      this.activeRouteName = this.routeNames[last] ?? '';
    });
  }
  isLoggingOut = false;
  unreadTotal: number = 0;

  logout() {
    if (this.isLoggingOut) return; // éviter clic multiple
    this.isLoggingOut = true;

    this.authService.logout().subscribe({
      next: () => {
        this.isLoggingOut = false;
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isLoggingOut = false;
        alert('Erreur lors de la déconnexion. Réessayez plus tard.');
      }
    });
  }


  myProfile() {
    const dialogRef = this.modalService.open(ProfileComponent, {
      windowClass: "xlModal",
      scrollable: true
    });
    dialogRef.componentInstance.loadUser(this.connectedUser.id);
    dialogRef.componentInstance.action = "Edition d'un utilisateur";
    dialogRef.componentInstance.loadGroupeMember();
    dialogRef.result.then((result) => {
    })
  }
}
