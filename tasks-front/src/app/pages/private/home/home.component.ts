import {Component, OnInit} from '@angular/core';
import {IssueService} from "../../../services/issue.service";
import {Project, User} from "../../../type/issue";
import {Router} from "@angular/router";
import {AuthService} from "../../../services/auth.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {UserService} from "../../../services/user.service";
import {AuthGuard} from "../../../services/SystemGuard";
import {PopupCreateProjectComponent} from "../popup-create-project/popup-create-project.component";
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{
  projects:Project[]= [];
  isLoading = false;
  loadingMessage = 'Veuillez patienter';

  private project = null;
  leftColor: any;
  constructor(private router: Router,
              private authService: AuthService,
              private modalService: NgbModal,
              protected issueService:IssueService,
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
    this.router.navigate(["/working/"+project.prefix+"/list/master"]);
    this.isLoading = true;
    this.loadingMessage = `Ouverture de « ${project.name} »`;

    setTimeout(() => {
      this.router.navigate(["/working/" + project.prefix + "/list/master"]);
      this.isLoading = false;
    }, 300);
  }

  createProject(){
    const dialogRef = this.modalService.open(PopupCreateProjectComponent,);
    throw dialogRef.result.then(res=> {
      this.issueService.loadProjectList();
     // this.selectProject(res);
    })
  }


}
