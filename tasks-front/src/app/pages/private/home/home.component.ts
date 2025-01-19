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
      this.issueService.loadProjectList();
     // this.selectProject(res);
    })
  }

  getImageProject(project: Project) {

    if (project.imageUrl != null) {
      return environment.apiURL + 'photo/' + project.imageUrl;
    }
    if (project.domainActivity) {
      if (project.domainActivity.image) {
        return environment.apiURL + 'photo/' + project.domainActivity.image;
      }
      return this.getImagetP(project.domainActivity.name);
    }
    return 'assets/images/work-space/controle-equipe.jpg';

  }
  getImagetP(domain: string): string {

    switch (domain) {
      case 'TOPO':
        return 'assets/images/work-space/topo-route.jpeg';
      case 'BATIMENT':
        return 'assets/images/work-space/btp.jpg';
      case 'DEV':
        return 'assets/images/work-space/equipe-dev.jpg';
      case 'COMPTABILITE':
        return 'assets/images/work-space/comptabilite.png';
      case 'MEDIA':
        return 'assets/images/work-space/montage-video.png';
      case 'DEFAULT':
        return 'assets/images/work-space/controle-equipe.jpg';
      default:
        return 'assets/images/work-space/controle-equipe.jpg';
    }
  }
}
