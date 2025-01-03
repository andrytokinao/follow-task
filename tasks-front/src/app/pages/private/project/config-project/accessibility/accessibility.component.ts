import {Component, OnInit} from '@angular/core';
import {TreeDossierItemComponent} from "../../../../../common/tree-dossier-item/tree-dossier-item.component";
import {ConfigProject, GroupeUser, MemberGroupe, Project} from "../../../../../type/issue";
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
  templateUrl: './accessibility.component.html',
  styleUrl: './accessibility.component.css'
})
export class AccessibilityComponent implements OnInit{
  accessibilityProject:ConfigProject[]=[];
  configProjects : ConfigProject[]=[];
  project:Project;
  groupeUsers:GroupeUser[]=[]
  constructor(
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
    this.issueService.project$.subscribe(project=> this.project = project);
    this.route.data.subscribe(data => {
      this.issueService.getConfigProject(this.project.id).subscribe(res=>{
        this.configProjects = res;
        this.loadConfig();
      });
      this.userService.groupeUsers$.subscribe(groupeUsers => {
        this.groupeUsers = groupeUsers;
      })
      this.getGroupeUserForProject();

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
    })
  }
  editMamberForGroupe(member:MemberGroupe,groupe:GroupeUser){
    const dialogRef = this.modalService.open(AddMamberGroupeComponent, { windowClass: 'centerModal'});
    dialogRef.componentInstance.groupeUser = groupe;
    dialogRef.componentInstance.setMember( member);
    dialogRef.result.then((res) => {
      this.getGroupeUserForProject();
    })
  }

}
