import {Component, OnInit} from '@angular/core';
import {ConfigProject, GroupeUser, MemberGroupe, Permission, Project} from "../../../../../type/issue";
import {ConfirmationDialogService} from "../../../../../services/confirmation-dialog.service";
import {IssueService} from "../../../../../services/issue.service";
import {HttpClient} from "@angular/common/http";
import {ConfigService} from "../../../../../services/config.service";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {MatDialog} from "@angular/material/dialog";
import {AddMamberGroupeComponent} from "../../../admins/groups/add-mamber-groupe/add-mamber-groupe.component";
import {FormControl} from "@angular/forms";
import {UserService} from "../../../../../services/user.service";

@Component({
  selector: 'app-accessibility',
  standalone: false,
  templateUrl: './accessibility.component.html',
  styleUrl: './accessibility.component.css'
})
export class AccessibilityComponent implements OnInit{
  accessibilityProject:ConfigProject[]=[];
  configProjects : ConfigProject[]=[];
  project:Project;
  groupeUsers:GroupeUser[]=[]
  permission: Permission;
  search = '';
  constructor(
    private confirmationDialogService: ConfirmationDialogService,
    private http:HttpClient,
    private configService:ConfigService,
    private issueService:IssueService,
    protected userService:UserService,
    private router: Router,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    public dialog: MatDialog,

  ) {
  }
  loadConfig(){
    this.issueService.getConfigProject(this.project.id).subscribe(res=>{
      this.configProjects = res;
      if( this.configProjects != null ) {

      }
    })
  }

  ngOnInit(): void {
    this.issueService.project$.subscribe(project=> {
      this.project = project;
      if (this.project) {
        this.getGroupeUserForProject();
      }

    });
    this.route.data.subscribe(data => {
      this.userService.groupeUsers$.subscribe(groupeUsers => {
        this.groupeUsers = groupeUsers;
      })
      this.userService.permissionTask$.subscribe(permission => this.permission = permission);
      this.userService.loadPermissiontTask();

    });
  }
  getGroupeUserForProject(){
    this.userService.loadGroupeUserForProject(this.project.prefix);
  }

  addMembrerForGroupe(groupe: GroupeUser) {
   const dialogRef = this.modalService.open(AddMamberGroupeComponent, { windowClass: 'centerModal'});
    dialogRef.componentInstance.groupeUser = groupe;
    dialogRef.result.then((res) => {
      this.getGroupeUserForProject();
    }, () => {})
  }
  editMamberForGroupe(member:MemberGroupe,groupe:GroupeUser){
    const dialogRef = this.modalService.open(AddMamberGroupeComponent, { windowClass: 'centerModal'});
    dialogRef.componentInstance.groupeUser = groupe;
    dialogRef.componentInstance.setMember( member);
    dialogRef.result.then((res) => {
      this.getGroupeUserForProject();
    }, () => {})
  }

  confirmDeleteMember(member: MemberGroupe, groupe: GroupeUser) {
    this.confirmationDialogService.confirm('Retirer le membre',
      `Retirer ${member.user?.firstName} ${member.user?.lastName} du groupe ${groupe.name} ?`,
      'Retirer', 'Annuler')
      .then(confirmed => {
        if (confirmed) {
          this.deleteMember(member.id);
        }
      }, () => {});
  }

    deleteMember(memberId: Number) {
      this.userService.deleteMember(memberId).subscribe(res => {
        this.getGroupeUserForProject();
      })
  }

  /** Libelle d'un role, a defaut son code. */
  roleLabel(role: string): String {
    return this.permission?.roles?.find(r => r.name === role)?.description || role;
  }

  matchesSearch(member: MemberGroupe): boolean {
    const filtre = this.search.trim().toLowerCase();
    if (!filtre || !member.user) {
      return true;
    }
    return [member.user.firstName, member.user.lastName, member.user.username]
      .some(value => value?.toLowerCase().includes(filtre));
  }

  visibleMembers(groupe: GroupeUser): MemberGroupe[] {
    return (groupe.members || []).filter(member => this.matchesSearch(member));
  }
}
