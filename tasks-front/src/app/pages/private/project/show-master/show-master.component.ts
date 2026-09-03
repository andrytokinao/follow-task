import {Component, OnDestroy, OnInit} from '@angular/core';
import {animate, style, transition, trigger} from "@angular/animations";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Observable, Subscription} from "rxjs";
import {shareReplay} from "rxjs/operators";
import {ProjectGuard} from "../../../../services/ProjectGuard";
import {ConfigService} from "../../../../services/config.service";
import {IssueService} from "../../../../services/issue.service";
import {PageTitleService} from "../../../../services/page-title.service";
import {CustomField, Issue, Project} from "../../../../type/issue";

@Component({
  standalone:false,
  selector: 'app-show-master',
  templateUrl: './show-master.component.html',
  styleUrl: './show-master.component.css',
  animations: [
    trigger('contentAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-10%)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms ease-in',
          style({ opacity: 0, transform: 'translateX(10%)' })
        ),
      ]),
    ]),
  ],
})
export class ShowMasterComponent implements OnInit, OnDestroy {
  tabs = ['Commentaire', 'Champ', 'Sous-tâche', 'Livraison'];
  activeTab = this.tabs[0];

  subtasks: string[] = ['Sous-tâche 1', 'Sous-tâche 2'];
  newSubtask: string = '';
  project:Project | undefined;
  private issues: Issue[]=[]

  deliveryDate = '2024-10-30';
  deliveryStatus = 'En cours';
  private customFields: CustomField[] = [];
  protected parrentIssue: Issue | undefined;

  selectTab(tab: string) {
    this.activeTab = tab;
  }
  /** Abonnement du titre, tenu à part pour être libéré (voir ngOnDestroy). */
  private titleSubscription?: Subscription;

  /**
   * Le rapport expose les heures de chaque intervenant : l'onglet n'est proposé
   * qu'au gestionnaire de projet et à l'administrateur.
   *
   * `hasCredential` renvoie un Observable froid qui refait tout son travail à
   * chaque abonnement — d'où le `shareReplay`, sans quoi le `| async` du gabarit
   * relancerait la résolution des droits à chaque cycle de détection.
   * Il accorde déjà l'accès aux porteurs de `CAN_ACCESS_ALL`, l'administrateur
   * global est donc couvert.
   */
  protected readonly peutVoirRapport$: Observable<boolean>;

  constructor(private router: Router,
              private modalService: NgbModal,
              private configService:ConfigService,
              protected issueService:IssueService,
              private route: ActivatedRoute,
              private pageTitle: PageTitleService,
              private projectGuard: ProjectGuard
  ) {
    this.peutVoirRapport$ = this.projectGuard
      .hasCredential(['PROJECT_MANAGER', 'ADMIN'])
      .pipe(shareReplay(1));
  }
  addSubtask() {
    if (this.newSubtask.trim()) {
      this.subtasks.push(this.newSubtask.trim());
      this.newSubtask = '';
    }
  }
  ngOnInit(): void {
    this.issueService.project$.subscribe(project=> this.project = project)
    this.route.data.subscribe(data => {
  //    this.parrentIssue = data['parrentIssue'];
    });
    this.issueService.issueMaster$.subscribe(issue => {
      this.parrentIssue = issue;
    })
    this.issueService.allCustomField$.subscribe(customFields=>{
      this.customFields = customFields;

    })

    // Titre de l'onglet : « PRJ-12 · Refaire le métré · Paikady ».
    // Abonnement distinct de celui ci-dessus, et explicitement libéré : les
    // autres abonnements de ce composant ne le sont pas, et un titre qui
    // survivrait à la navigation écraserait celui de la page suivante.
    this.titleSubscription = this.issueService.issueMaster$.subscribe(issue => {
      this.pageTitle.set(issue?.issueKey?.toString(), issue?.summary?.toString());
    });
  }

  ngOnDestroy(): void {
    this.titleSubscription?.unsubscribe();
  }
  /**
   * TODO :
   * 1 Creer une tache ticket maire
   *  Preparation
   *  -  Type : tous les ticket maitre (back + front ) 19 :00
   *  -  Regle de numerotation ( back + Front ) 19 : 20
   *  -  Recueration de dernier numero ou key ( back + front ) 19:40
   * 2 Enregistrement
   *  - Utiliser les fonction existante ( Front ) 19:50
   *  - Recuperation de configuration de repertoire / Creation si inexiste ( back + front ) 20:10
   * 3 Poste :
   *  - Fermer la dialogue ( front ) 20:20
   *  - Rediriger vers l'affichage de detail ( Seulement pour la ticket maitre ) ( front ) 20:40
   * 4 Affichage details / Edition 21:30
   *  - Recuperation / Affichage / Edition des custom field ( front )
   *  - Affichage , add description ( avec l'utilisateur  ) front
   *  - Preparation des sous tache TODO plus tard
   * */
}
