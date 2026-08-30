import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {UserService} from "../../services/user.service";
import {FormControl} from "@angular/forms";
import {Issue, IssueMembership, User} from "../../type/issue";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../services/issue.service";
import {ActivatedRoute} from "@angular/router";
import {ToastrService} from "ngx-toastr";
import {AuthGuard} from "../../services/SystemGuard";
import {AuthService} from "../../services/auth.service";
import {ProjectGuard} from "../../services/ProjectGuard";

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
  @Input() issue: Issue;
  /** nombre d'avatars affiches avant le compteur "+N" */
  @Input() maxAvatars: number = 3;
  @Output() save = new EventEmitter<Issue>();

  constructor(
    private modalService: NgbModal,
    protected issueService: IssueService,
    public userService: UserService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    protected authGuard: AuthGuard,
    private authService: AuthService,
    protected projectGuard: ProjectGuard
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
      this.syncSelection();
    }
  }

  /**
   * Assignes courants : issus des memberships actifs, avec repli sur l'ancien
   * champ assigne pour les issues creees avant la gestion multi-assignes.
   */
  get assignees(): User[] {
    if (this.issue == null) {
      return [];
    }
    const memberships: IssueMembership[] = this.issue.activeMemberships || [];
    const users = memberships
      .filter(membership => membership.user != null && membership.role != 'OBSERVER')
      .map(membership => <User>membership.user);
    if (users.length == 0 && this.issue.assigne != null && this.issue.assigne.id) {
      return [this.issue.assigne];
    }
    return users;
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
    if (user == null) {
      return '';
    }
    const name = ((user.firstName || '') + ' ' + (user.lastName || '')).trim();
    return name || (user.username || '');
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
