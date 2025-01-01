import {Component, OnInit} from '@angular/core';
import {IssueService} from "../../../services/issue.service";
import {Project} from "../../../type/issue";
import {Router} from "@angular/router";
import {AuthService} from "../../../services/auth.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {UserService} from "../../../services/user.service";
import {AuthGuard} from "../../../services/authorization.service.ts";
import {PopupCreateProjectComponent} from "../popup-create-project/popup-create-project.component";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{
  projects:Project[]= [];
  private project = null;
  constructor(private router: Router,
              private authService: AuthService,
              private modalService: NgbModal,
              private issueService:IssueService,
              protected userService:UserService,
              protected authGuard:AuthGuard

  ){

  }
  ngOnInit(): void {
    this.issueService.projects$.subscribe(projectes => {
      this.projects = projectes;
    })
  }
  selectProject(project: Project) {
    this.project = project;
    this.router.navigate(["/private/working/"+project.prefix+"/list/master"])
  }

  createProject(){
    const dialogRef = this.modalService.open(PopupCreateProjectComponent,);
    throw dialogRef.result.then(res=> {
      this.selectProject(res);
    })
  }
}
