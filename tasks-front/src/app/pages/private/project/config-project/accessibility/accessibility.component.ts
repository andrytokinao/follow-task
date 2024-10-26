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
    this.route.data.subscribe(data => {
      this.project = data['project'];
      this.issueService.getConfigProject(this.project.id).subscribe(res=>{
        this.configProjects = res;
        this.loadConfig();
      });
      this.getGroupeUserForProject();

    });
  }
  getGroupeUserForProject(){
    this.issueService.getGroupeUserForProject(this.project.id).subscribe(
      groupeUser=> {
        this.groupeUsers = groupeUser;
      }
    )
  }

  addMembrerForGroupe(groupe: GroupeUser) {
   const dialogRef = this.modalService.open(AddMamberGroupeComponent, { windowClass: 'centerModal'});
    dialogRef.componentInstance.groupeUser = groupe;
    dialogRef.result.then((res) => {
      this.getGroupeUserForProject();

    })
  }
  editMamberForGroupe(member:MemberGroupe){
    const dialogRef = this.modalService.open(AddMamberGroupeComponent, { windowClass: 'centerModal'});
    dialogRef.componentInstance.groupeUser = member.groupe;
    dialogRef.componentInstance.memberGroupe = member;
    dialogRef.result.then((res) => {
      this.getGroupeUserForProject();
    })
  }

}
