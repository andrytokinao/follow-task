import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {LocalStorageService} from "../../services/local-storage.service";
import {ProfileComponent} from "./profile/profile.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Project, User} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {UserService} from "../../services/user.service";
import {AuthGuard} from "../../services/SystemGuard";
import {IssueTypeComponent} from "./admins/config-project/issue-type/issue-type.component";
import {PopupCreateProjectComponent} from "./popup-create-project/popup-create-project.component";

@Component({
  selector: 'private-root',
  templateUrl: './private.component.html',
  styleUrl: './private.component.css'
})
export class PrivateComponent {
  profile:any  = {};
  title = 'tasks-front';
  projects:Project[] = [];
  project:Project | undefined;
  connectedUser:User | undefined;
  constructor(private router: Router,
              private authService: AuthService,
              private modalService: NgbModal,
              private issueService:IssueService,
              protected userService:UserService,
              protected authGuard:AuthGuard

  ) {
    this.authService.getProfile().subscribe(profile=>{
      this.profile = profile;
    });
    this.authService.connectedUser$.subscribe(user => {
      this.connectedUser = user;
      if (this.connectedUser) {
        this.issueService.getProjectByUser(this.connectedUser.id);
      }
    });
    this.issueService.projects$.subscribe(projectes => {
      this.projects = projectes;
    })
  }
  logout(){
    this.authService.logout().subscribe(
      res => {
        this.router.navigate(["/login"]);
      },error => {
        this.router.navigate(["/login"]);
      }
    );
  }

  myProfile() {
    const dialogRef = this.modalService.open(ProfileComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.loadUser(this.profile.id);
    dialogRef.componentInstance.action ="Edition d'un utilisateur";
    dialogRef.componentInstance.loadGroupeMember();
    dialogRef.result.then((result) => {
    })
  }

  selectProject(project: Project) {
    this.project = project;
    this.router.navigate(["/private/working/"+project.prefix+"/list"])
  }
}
