import { Component } from '@angular/core';
import {IssueService} from "../../../../../services/issue.service";
import {Criteria, Issue, IssueType, Project, Status, User, WorkFlow} from "../../../../../type/issue";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {UserService} from "../../../../../services/user.service";
import {ActivatedRoute} from "@angular/router";
import {ToastrService} from "ngx-toastr";
import {AuthGuard} from "../../../../../services/SystemGuard";
import {NewIssueComponent} from "../../modal/new-issue/new-issue.component";
import {stripTypename} from "@apollo/client/utilities";
import {ViewEditIssueComponent} from "../../modal/view-edit-issue/view-edit-issue.component";

@Component({
  standalone:false,
  selector: 'app-issue-boaard',
  templateUrl: './issue-boaard.component.html',
  styleUrl: './issue-boaard.component.css'
})
export class IssueBoaardComponent {
  public essueService: IssueService
  public issuesBoard: [any, Issue[]][] = [];
  public issues: Issue[] = [];
  public users: User[] = [];
  public currentIssue: Issue | null = null;
  workflow: Status[] = [];
  currentWorkflow: WorkFlow | any = {};
  currentWorkflows: WorkFlow[]=[];
  description: string = "";
  summary: string = "";
  nom: any;
  email: any;
  project: Project | undefined;
  issueType: IssueType | any = {};

  constructor(
    private modalService: NgbModal,
    private issueService: IssueService,
    essueService: IssueService,
    public userService: UserService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    protected authGuard:AuthGuard

  ) {
    this.essueService = essueService;
/*    this.issueService.issues$.subscribe(issues => {
      alert(issues.length);
      this.currentWorkflows = this.issueService.getDistinctWorkflows(issues);
      if (this.currentWorkflows != null && this.currentWorkflows.length != 0) {
        this.currentWorkflow = this.currentWorkflows[0];
        this.loadByWorkFlow(this.currentWorkflow);
      }
      this.issues = issues;
    });*/
    this.essueService.issueMasterList$.subscribe(issues => {
      this.setIssues(issues);
      this.currentWorkflows = this.issueService.getDistinctWorkflows(issues);
      if (this.currentWorkflows != null && this.currentWorkflows.length != 0) {
        this.currentWorkflow = this.currentWorkflows[0];
        this.loadByWorkFlow(this.currentWorkflow);
      }
    });
  }

  // Regroupement calculé une fois par changement de liste. Le gabarit
  // appelait `filterByStatus(status)` deux fois par colonne (cartes +
  // compteur) : autant de parcours complets du tableau à CHAQUE cycle de
  // détection de changements.
  private issuesByStatusId = new Map<number, Issue[]>();

  private setIssues(issues: Issue[]) {
    this.issues = issues ?? [];
    this.regroupByStatus();
  }

  private regroupByStatus() {
    const grouped = new Map<number, Issue[]>();
    for (const issue of this.issues) {
      const statusId = issue.status?.id;
      if (statusId == null) continue;
      const bucket = grouped.get(statusId);
      if (bucket) {
        bucket.push(issue);
      } else {
        grouped.set(statusId, [issue]);
      }
    }
    this.issuesByStatusId = grouped;
  }

  issuesFor(status: Status): Issue[] {
    return this.issuesByStatusId.get(status?.id) ?? [];
  }

  trackByIssue(_index: number, issue: Issue): number | string {
    return issue.id ?? String(issue.issueKey);
  }

  trackByStatus(_index: number, status: Status): number {
    return status.id;
  }

  trackByUser(_index: number, user: User): string {
    return user.id;
  }

  newIssueTest(status: Status) {
    const dialogRef = this.modalService.open(NewIssueComponent);
    dialogRef.componentInstance.status = status;
    dialogRef.componentInstance.project = this.project;
    dialogRef.result.then((result) => {
      // setIssues plutôt qu'un push : le regroupement par statut doit être
      // recalculé, sinon la nouvelle carte n'apparaît dans aucune colonne.
      this.setIssues([...this.issues, result.issue]);
      this.essueService.ajouterAuGroupe(this.issuesBoard, result.issue.status, result.issue);
    }).catch((reason) => {
      console.log('modal cancelled' + reason.message);
    });
  }

  newIssue(status: Status) {
    const dialogRef = this.modalService.open(NewIssueComponent);
    dialogRef.componentInstance.allIssueTypes = this.currentWorkflow.allIssueTypes;
    dialogRef.componentInstance.status = status;
    dialogRef.result.then((result) => {
      this.setIssues(<Issue[]>stripTypename(result.issues));
    })
  }

  canCreate(status: Status): boolean {
    // TODO : return false if user can not create
    if (status.id === 1)
      return true;
    return true;
  }

  isActive(user: User): boolean {
    if (this.currentIssue != null && this.currentIssue.assigne != null) {
      return this.currentIssue.assigne.id == user.id;
    }
    return false;
  }

  // Statut actuellement survolé pendant un glisser-déposer.
  dragOverStatusId: number | null = null;

  onDragStart($event: DragEvent, issue: Issue) {
    this.currentIssue = issue;
    // Sans effectAllowed/setData, Firefox refuse de démarrer le glissement.
    $event.dataTransfer?.setData('text/plain', String(issue.id ?? ''));
    if ($event.dataTransfer) $event.dataTransfer.effectAllowed = 'move';
  }

  onDragEnd() {
    this.currentIssue = null;
    this.dragOverStatusId = null;
  }

  onDrop($event: DragEvent, status: any) {
    $event.preventDefault();
    this.dragOverStatusId = null;

    const moved = this.currentIssue;
    if (moved == null) return;

    const previousStatus = moved.status;
    if (previousStatus?.id === status?.id) {
      this.currentIssue = null;
      return;
    }

    // Déplacement optimiste : la carte change de colonne immédiatement, et
    // revient à sa place si l'enregistrement échoue.
    moved.status = status;
    this.regroupByStatus();

    this.issueService.saveIssue(moved).subscribe({
      next: () => {
        this.currentIssue = null;
      },
      error: (err) => {
        console.error(err);
        moved.status = previousStatus;
        this.regroupByStatus();
        this.currentIssue = null;
      }
    });
  }

  onDragOver($event: DragEvent, status?: any) {
    $event.preventDefault();
    if ($event.dataTransfer) $event.dataTransfer.dropEffect = 'move';
    if (status) this.dragOverStatusId = status.id;
  }

  onDragLeave(status: any) {
    if (this.dragOverStatusId === status?.id) {
      this.dragOverStatusId = null;
    }
  }

  filerWorkFlow(): Status[] {
    // TODO : Filtrer l'affichage de workflow selon le role de l'utilisateur
    let flows: number[] = [0, 1, 2, 3, 4, 5];
    if (this.workflow != null)
      return this.workflow.filter(wf => flows.indexOf(wf.id) != -1);
    return [];
  }

  assign(issue: Issue) {
    this.currentIssue = issue;
  }


  assigneToUser(user: User) {
    if (this.currentIssue != null) {
      this.currentIssue.assigne = user;
      this.issueService.assigneToUser(this.currentIssue,user).subscribe(()=>{
          // On garde l'objet déjà présent dans la liste : le remplacer par la
          // réponse du serveur détacherait la carte de `issues`, et l'avatar
          // ne se rafraîchirait pas.
          this.currentIssue = null;
        }
      );
    }
  }

  submitForm() {

  }

  viewIssue(issue: Issue) {
    if (true)
      return; // desactiver pour le moment
    const dialogRef = this.modalService.open(ViewEditIssueComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.issue = issue;
    dialogRef.componentInstance.users = this.users;
    dialogRef.result.then((result) => {
      this.currentIssue = null;
    })
  }

  ngOnInit(): void {
    this.issueService.project$.subscribe(project=> this.project = project);
    this.userService.users$.subscribe((users) => {
      this.users = users;
    });
  }

  loadByWorkFlow(currentWorkflow:WorkFlow) {
    let criterias: Criteria[] =[];
    for (let type of currentWorkflow.issueTypes){
      let criteria:Criteria | any = {};
      criteria.field ="issueTypeId";
      criteria.value = type.id;
      criteria.operator ="eq";
    }
    this.issueService.issueByCriteria(criterias).subscribe(issues => {
      this.setIssues(issues);
    });
  }
  getUrlPhoto(user:User){
    return this.userService.getUrlPhoto(user);
  }
}
