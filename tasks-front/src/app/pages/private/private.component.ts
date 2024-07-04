import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {LocalStorageService} from "../../services/local-storage.service";
import {ProfileComponent} from "./profile/profile.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Project, User} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {UserService} from "../../services/user.service";
import {AuthGuard} from "../../services/authorization.service.ts";

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
    this.allProjects();
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
    dialogRef.componentInstance.loadComments();
    dialogRef.componentInstance.loadValues();
    dialogRef.componentInstance.allCustomField();
    dialogRef.componentInstance.loadDirectory();
    dialogRef.result.then((result) => {
    })
  }
  allProjects(){
    this.issueService.allProjects().subscribe(projects=>{
      this.projects = projects;
    })
  }

  selectProject(project: Project) {
    this.project = project;
    this.router.navigate(["/private/project/"+project.prefix+"/liste"])
  }
}
