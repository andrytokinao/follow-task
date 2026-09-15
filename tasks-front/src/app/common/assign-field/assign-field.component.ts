import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {UserService} from "../../services/user.service";
import {FormControl} from "@angular/forms";
import {Issue, User} from "../../type/issue";
import {issueAssignees, userDisplayName} from "../../type/issue-grouping.util";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../services/issue.service";
import {ActivatedRoute} from "@angular/router";
import {ToastrService} from "ngx-toastr";
import {AuthGuard} from "../../services/SystemGuard";
import {AuthService} from "../../services/auth.service";
import {ProjectGuard} from "../../services/ProjectGuard";
import {MasterGuard} from "../../services/MasterGuard";

@Component({
  standalone: false,
  selector: 'app-assign-field',
  templateUrl: './assign-field.component.html',
  styleUrl: './assign-field.component.css'
})
export class AssignFieldComponent implements OnInit, OnChanges {
  roUser: boolean;
  userControl: FormControl;
  isEditing: any;
  user: User;
  users: User[] = [];
  /** identifiants des utilisateurs actuellement assignes */
  selectedIds: string[] = [];
  searchTerm: string = '';
  saving: boolean = false;
  /** Droit d'assigner sur cette issue ; null tant que le menu n'a pas ete ouvert. */
  canAssign: boolean | null = null;
  @Input() issue: Issue;
  /** nombre d'avatars affiches avant le compteur "+N" */
  @Input() maxAvatars: number = 3;
  /** largeur maximale du libelle, en pixels ; 0 masque le libelle (avatars seuls) */
  @Input() maxLabelWidth: number = 140;
  @Output() save = new EventEmitter<Issue>();

  constructor(
    private modalService: NgbModal,
    protected issueService: IssueService,
    public userService: UserService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    protected authGuard: AuthGuard,
    private authService: AuthService,
    protected projectGuard: ProjectGuard,
    private masterGuard: MasterGuard
  ) {

  }

  ngOnInit() {
    this.userService.allMembers$.subscribe((users: any) => {
      this.users = users || [];
    });
    this.syncSelection();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['issue']) {
      this.canAssign = null;
      this.syncSelection();
    }
  }

  /**
   * Evalue le droit d'assigner a l'ouverture du menu seulement : dans une
   * liste, une verification par ligne multiplierait les requetes.
   * Workspace (CAN_ASSIGN_TASK) ou assigne d'une issue parente.
   */
  loadCanAssign() {
    if (this.canAssign !== null || this.issue == null) {
      return;
    }
    const projectPrefix = (this.issue.project?.prefix as string)
      ?? this.route.snapshot.pathFromRoot
        .map(snapshot => snapshot.paramMap.get('project'))
        .find(prefix => !!prefix);
    this.masterGuard.hasIssueCredential(['CAN_ASSIGN_TASK'], projectPrefix, this.issue.issueKey as string)
      .subscribe(canAssign => this.canAssign = canAssign);
  }

  get assignees(): User[] {
    return issueAssignees(this.issue);
  }

  get visibleAssignees(): User[] {
    return this.assignees.slice(0, this.maxAvatars);
  }

  get hiddenCount(): number {
    return Math.max(0, this.assignees.length - this.maxAvatars);
  }

  get assigneesLabel(): string {
    const users = this.assignees;
    if (users.length == 0) {
      return 'Non assigné';
    }
    if (users.length == 1) {
      return 'Assigné à ' + this.displayName(users[0]);
    }
    return this.displayName(users[0]) + ' +' + (users.length - 1);
  }

  /** Liste complete des assignes : le libelle etant tronque, le survol la restitue. */
  get assigneesTitle(): string {
    const users = this.assignees;
    return users.length == 0
      ? 'Non assigné'
      : users.map(user => this.displayName(user)).join(', ');
  }

  get filteredUsers(): User[] {
    const term = (this.searchTerm || '').toLowerCase().trim();
    if (!term) {
      return this.users;
    }
    return this.users.filter(user =>
      (user.firstName || '').toLowerCase().includes(term) ||
      (user.lastName || '').toLowerCase().includes(term) ||
      (user.username || '').toLowerCase().includes(term));
  }

  displayName(user: User): string {
    return userDisplayName(user);
  }

  /**
   * URL de la photo, ou null quand l'utilisateur n'en a pas : `getUrlPhoto`
   * renvoie sinon la meme silhouette pour tout le monde. Avec null, app-avatar
   * genere des initiales sur une couleur derivee du nom, donc distinctes.
   */
  photoUrl(user: User): string | null {
    return user && user.photo ? this.userService.getUrlPhoto(user) : null;
  }

  isActive(user: User): boolean {
    return this.selectedIds.includes(user.id);
  }

  /**
   * Ajoute ou retire un utilisateur de l'assignation sans fermer le menu.
   */
  toggleUser(user: User, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (this.issue == null || this.saving) {
      return;
    }
    const ids = this.isActive(user)
      ? this.selectedIds.filter(id => id != user.id)
      : [...this.selectedIds, user.id];
    this.applyAssignment(ids);
  }

  /**
   * Retire tous les assignes de l'issue.
   */
  clearAssignment(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (this.issue == null || this.saving) {
      return;
    }
    this.applyAssignment([]);
  }

  /**
   * Assignation a un seul utilisateur (comportement historique).
   */
  assigneToUser(user: User) {
    if (this.issue != null) {
      this.applyAssignment([user.id]);
    }
  }

  private applyAssignment(userIds: string[]) {
    const users = userIds
      .map(id => this.users.find(user => user.id == id) || this.assignees.find(user => user.id == id))
      .filter(user => user != null) as User[];
    const previous = this.selectedIds;
    this.selectedIds = userIds;
    this.saving = true;
    this.issueService.assignUsers(this.issue, users).subscribe({
      next: (issue: Issue) => {
        // mise a jour sur place : l'issue est partagee avec la vue parente
        this.issue.assigne = issue.assigne;
        this.issue.activeMemberships = issue.activeMemberships;
        this.issue.observerIds = issue.observerIds;
        // Le droit d'assigner peut changer avec les assignations.
        this.canAssign = null;
        this.syncSelection();
        this.saving = false;
        this.save.emit(this.issue);
      },
      error: () => {
        this.selectedIds = previous;
        this.saving = false;
        this.toastr.error("Impossible de modifier l'assignation");
      }
    });
  }

  private syncSelection() {
    this.selectedIds = this.assignees.map(user => user.id);
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }
}
