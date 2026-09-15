import {ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {MatMenuTrigger} from "@angular/material/menu";
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
  /**
   * Droit d'assigner sur cette issue. null : sous-tache dont le droit depend
   * des assignations, verifie au premier clic seulement (une requete par ligne
   * d'une liste serait trop couteuse).
   */
  canAssign: boolean | null = null;
  private checkingCanAssign = false;
  private recheckOnClose = false;
  @ViewChild('menuTrigger') menuTrigger: MatMenuTrigger;
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
    private masterGuard: MasterGuard,
    private changeDetector: ChangeDetectorRef
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
      this.evaluateCanAssign();
      this.syncSelection();
    }
  }

  /**
   * Decision immediate, sans requete : droit de l'espace de travail lu dans le
   * profil. Une issue master ne se (re)assigne que par l'espace de travail ;
   * pour une sous-tache sans ce droit, on reste indecis jusqu'au clic.
   */
  private evaluateCanAssign() {
    this.canAssign = null;
    if (this.issue == null) {
      return;
    }
    const workspace = this.masterGuard.hasProjectCredential(['CAN_ASSIGN_TASK'], this.projectPrefix());
    if (workspace) {
      this.canAssign = true;
    } else if (workspace === false && this.issue.parent === null) {
      this.canAssign = false;
    }
  }

  /**
   * Premier clic sur une sous-tache : on demande au serveur si une assignation
   * sur une issue parente donne le droit, et le menu ne s'ouvre que dans ce cas.
   */
  onTriggerClick() {
    if (this.canAssign !== null || this.checkingCanAssign || this.issue == null) {
      return;
    }
    this.checkingCanAssign = true;
    this.masterGuard.hasIssueCredential(['CAN_ASSIGN_TASK'], this.projectPrefix(), this.issue.issueKey as string)
      .subscribe(canAssign => {
        this.checkingCanAssign = false;
        this.canAssign = canAssign;
        if (canAssign) {
          // Differe : le declencheur doit d'abord recevoir le menu, et son
          // propre gestionnaire de clic ne doit pas le refermer aussitot.
          setTimeout(() => {
            this.changeDetector.detectChanges();
            this.menuTrigger?.openMenu();
          });
        }
      });
  }

  onMenuClosed() {
    if (this.recheckOnClose) {
      this.recheckOnClose = false;
      this.evaluateCanAssign();
    }
  }

  private projectPrefix(): string | undefined {
    return (this.issue?.project?.prefix as string)
      ?? this.route.snapshot.pathFromRoot
        .map(snapshot => snapshot.paramMap.get('project'))
        .find(prefix => !!prefix);
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
        // Le droit d'assigner peut changer avec les assignations : reevalue a
        // la fermeture, retirer le menu pendant qu'il est ouvert le casserait.
        this.recheckOnClose = true;
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
