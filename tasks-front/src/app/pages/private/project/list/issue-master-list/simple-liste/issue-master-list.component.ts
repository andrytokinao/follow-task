import {Component, ViewChild} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../../services/issue.service";
import {UserService} from "../../../../../../services/user.service";
import {ActivatedRoute, Router} from "@angular/router";
import {CustomFieldValue, Issue, IssueType, Project, Status, User, WorkFlow} from "../../../../../../type/issue";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {stripTypename} from "@apollo/client/utilities";
import {ViewEditIssueComponent} from "../../../modal/view-edit-issue/view-edit-issue.component";
import {ProjectGuard} from "../../../../../../services/ProjectGuard";
import {ConfirmationDialogService} from "../../../../../../services/confirmation-dialog.service";
import {AuthService} from "../../../../../../services/auth.service";
import {EventsService} from "../../../../../../services/events.service";
import {firstValueFrom} from "rxjs";

@Component({
  selector: 'app-issue-master-list',
  standalone: false,
  templateUrl: './issue-master-list.component.html',
  styleUrl: './issue-master-list.component.css'
})
export class IssueMasterListComponent {
  constructor(
    private modalService: NgbModal,
    protected issueService: IssueService,
    private essueService: IssueService,
    public userService: UserService,
    private route: ActivatedRoute,
    protected projectGruard:ProjectGuard,
    private router: Router,
    private authService:AuthService,
    private eventService:EventsService,
    private confirmationDialogService:ConfirmationDialogService
  ) {

  }
  public issues: Issue[] = [];
  public users: User[] = [];
  public currentIssue: Issue | null = null;
  workflow: Status[] = [];
  currentWorkflow: WorkFlow | any = {};
  description: string = "";
  summary: string = "";
  nom: any;
  email: any;
  project: Project | undefined;
  issueType: IssueType | any = {};
  displayedColumns: string[] = ['id', 'summary', 'description', 'issueKey', 'issueType', 'status'];
  dataSource:MatTableDataSource<Issue> ;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.isLoading = false;

    this.route.data.subscribe(data => {
      if (this.project && this.project.prefix) {
        this.userService.users$.subscribe((users ) => {
          this.users = stripTypename(users);
        });
      }
    });
    this.issueService.project$.subscribe(project => {
      this.project = project;
      console.debug(project);
      if (this.project) {
      }
    })
  }
  editIssue(issue:Issue){
      this.browsIssueMaster(issue);

  }
  openDialogIssue(issue:Issue){
    const dialogRef = this.modalService.open(ViewEditIssueComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.issue = issue;
    dialogRef.componentInstance.users = this.users;
    dialogRef.result.then((result) => {
      this.currentIssue = null;
    })
  }
  browsIssueMaster(issue:Issue){
    this.issueService.browsIssueMaster(issue);
  }
  editFilter() {
  }
  aplayFilter(){
  }

  isLoading: boolean = true;
  projects = [
    { title: 'Projet 1', description: 'Description du projet 1' },
    { title: 'Projet 2', description: 'Description du projet 2' },
    { title: 'Projet 3', description: 'Description du projet 3' }
  ];
  viewModeField: string = 'chip';

  ngOnInit() {
    // Le chargement est affiché par le parent (app-loading, alimenté par
    // issueService.loadingListSubtask$). Cette vue n'a plus de spinner
    // propre — l'ancien setTimeout de 2 s retardait l'affichage pour rien.
    this.essueService.issueMasterList$.subscribe((res: any) => {
      this.issues = stripTypename(res);
      this.computeStatusSummary();
      this.applyStatusFilter();
      this.dataSource =  new MatTableDataSource<Issue>(this.issues);
      this.dataSource.paginator = this.paginator;
      this.isLoading = false;
    });
  }

  // ---------------------------------------------------------------------
  // Filtre par statut
  // ---------------------------------------------------------------------

  // Aucun statut coché = aucun filtre : tout est affiché. C'est le
  // comportement attendu d'une barre de facettes, et ça évite l'état
  // « rien de coché, donc liste vide » qui n'aurait aucun sens ici.
  selectedStatusIds = new Set<number>();

  // Liste réellement rendue. Précalculée plutôt qu'exposée en getter : un
  // getter renverrait un nouveau tableau à chaque cycle de détection de
  // changements, forçant *ngFor à re-différencier toute la grille.
  visibleIssues: Issue[] = [];

  isStatusSelected(status: Status): boolean {
    return this.selectedStatusIds.has(status.id);
  }

  get hasStatusFilter(): boolean {
    return this.selectedStatusIds.size > 0;
  }

  toggleStatus(status: Status): void {
    if (this.selectedStatusIds.has(status.id)) {
      this.selectedStatusIds.delete(status.id);
    } else {
      this.selectedStatusIds.add(status.id);
    }
    this.applyStatusFilter();
  }

  clearStatusFilter(): void {
    this.selectedStatusIds.clear();
    this.applyStatusFilter();
  }

  private applyStatusFilter(): void {
    if (this.selectedStatusIds.size === 0) {
      this.visibleIssues = this.issues;
      return;
    }
    this.visibleIssues = this.issues.filter(
      issue => issue.status?.id != null && this.selectedStatusIds.has(issue.status.id)
    );
  }

  // ---------------------------------------------------------------------
  // Récapitulatif par statut, épinglé en haut de la liste
  // ---------------------------------------------------------------------

  statusSummary: { status: Status; count: number }[] = [];

  private computeStatusSummary(): void {
    const counts = new Map<number, number>();
    for (const issue of this.issues) {
      const id = issue.status?.id;
      if (id == null) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    // Ordre du workflow en priorité : il porte la progression métier
    // (À faire -> En cours -> Terminé) et fait apparaître les statuts à zéro,
    // ce qui est justement l'information utile. À défaut, on retombe sur les
    // statuts réellement présents dans les demandes.
    const workflowStatuses = this.issueService.getDistinctWorkflows(this.issues)?.[0]?.statuses;
    const statuses = workflowStatuses?.length ? workflowStatuses : this.distinctStatuses();

    this.statusSummary = statuses.map(status => ({
      status,
      count: counts.get(status.id) ?? 0,
    }));
  }

  private distinctStatuses(): Status[] {
    const byId = new Map<number, Status>();
    for (const issue of this.issues) {
      const status = issue.status;
      if (status?.id != null && !byId.has(status.id)) {
        byId.set(status.id, status);
      }
    }
    return Array.from(byId.values());
  }

  trackByStatus(_index: number, entry: { status: Status }): number {
    return entry.status.id;
  }

  statusColor(status: Status): string {
    return String(status?.color ?? '#6b7280');
  }

  // Pastille teintée : le suffixe hexadécimal ajoute l'alpha (14 ≈ 8 %,
  // 55 ≈ 33 %), pour rester lisible quelle que soit la couleur du statut.
  statusChipStyle(status: Status) {
    const color = this.statusColor(status);
    return {
      color,
      'border-color': color + '55',
      'background-color': color + '14',
    };
  }

  saveCustomFieldValue($event: CustomFieldValue) {

  }

  canShowInList(value: CustomFieldValue) {
    if (value == null)
      return false
    if (!(value.values != null || value.string != null || value.text != null || value.user != null || value.numeric != null ||  value.date != null)) {
      return false;
    }
    if (value.customField.configDisplay == null || value.customField.configDisplay.length == 0) {
      return false
    }
    return (value.customField.configDisplay.find(cf =>  cf == 'DisplayInList') != null)
  }
  trackByIssue(_index: number, issue: Issue): number | string {
    return issue.id ?? String(issue.issueKey);
  }

  // Colore le seul liseré gauche : teinter les quatre bords rendait les
  // cartes bruyantes quand plusieurs statuts se côtoient dans la grille.
  getStyleByStatus(issue:Issue){
    if (issue.status && issue.status.color) {
      return {['border-left-color']:issue.status.color}
    }
    return undefined;
  }


  public deleteIssue(master) {
    this.confirmationDialogService.confirm('Suppression de "'+master.summary+'"', 'Tous les dossier et information seront perdue  !!! Voulez vous supprimer cette demande ? ')
      .then((confirmed) => this.issueService.deleteIssue(master.id))
      .catch(() => console.log('User dismissed the dialog (e.g., by using ESC, clicking the cross icon, or clicking outside the dialog)'));
  }

  async addPlanning(master: Issue) {
    const profile = await firstValueFrom(this.authService.profile$);

    if (!profile) {
      console.warn('Aucun profil chargé');
      return;
    }

    this.eventService.newEventForIssue(master, profile).subscribe(event => {
      console.log('created event', event);
    });
  }
}
