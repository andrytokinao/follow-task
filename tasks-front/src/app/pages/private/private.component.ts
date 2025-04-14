import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {LocalStorageService} from "../../services/local-storage.service";
import {ProfileComponent} from "./profile/profile.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Project, Uploading, User} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {UserService} from "../../services/user.service";
import {AuthGuard} from "../../services/SystemGuard";
import {IssueTypeComponent} from "./admins/config-project/issue-type/issue-type.component";
import {PopupCreateProjectComponent} from "./popup-create-project/popup-create-project.component";
import {IssueSearchCriteriaInput} from "../../type/issue-search-criteria.util";
import {routeTransition} from "../../../route-transition";
import {animate, keyframes, state, style, transition, trigger, useAnimation} from "@angular/animations";
import {moveFromLeft} from "../../../../projects/router-animations/src/lib/router-animations";
import {moveFromLeftKeyframes} from "../../../../projects/router-animations/src/lib/shared-keyframes";
import {environment} from "../../../environments/environment";
import {MessagesService} from "../../services/messages.service";

@Component({
  selector: 'private-root',
  standalone: false,
  templateUrl: './private.component.html',
  styleUrl: './private.component.css',
  animations: [

    trigger('workspace', [
      state('start', style({
        transform: 'translateX(0%)'
      })),
      state('end', style({

      })),
      transition('start => end', [
        animate('0.8s 0s ease', keyframes([
          style({ opacity: '0.3', transform: 'translateX(100%) rotateY(-90deg)', offset: 0}),
          style({opacity: '1', transform: 'translateX(0%) rotateY(0deg)', offset: 1 })
        ]))
      ]),
      transition('end => start', [
        animate('0.8s 0s ease',  keyframes([
          style({ opacity: '1', transform: ' translateX(0%) rotateY(0deg)', offset: 0 }),
          style({opacity: '0.3', transform: 'translateX(-100%) rotateY(90deg)',offset: 1 })
        ]))
      ])
    ])
  ]
})
export class PrivateComponent {
  workspace = "";
  profile: any = {};
  title = 'tasks-front';
  projects: Project[] = [];
  project: Project | undefined;
  connectedUser: User | undefined;
  subtaskFilter: IssueSearchCriteriaInput = {};
  private filesToUploads: FileList;
  private uploadings: any;
  tempLogo: string | ArrayBuffer | null = null;
  private selectedLogo: File;
  protected logoUrl: string | ArrayBuffer | null = null;

  constructor(private router: Router,
              private authService: AuthService,
              private modalService: NgbModal,
              private issueService: IssueService,
              protected userService: UserService,
              protected authGuard: AuthGuard,
              protected systemGuerd :AuthGuard,
              protected messageService:MessagesService
  ) {
    this.authService.getProfile().subscribe(profile => {
      this.profile = profile;
    });
    this.authService.connectedUser$.subscribe(user => {
      this.connectedUser = user;
      if (this.connectedUser && this.connectedUser.id) {
        this.issueService.getProjectByUser(this.connectedUser.id);
        this.messageService.connectWs(this.connectedUser.id);
      } else {
        this.messageService.disconnectWs();
      }
    });
    this.issueService.projects$.subscribe(projectes => {
      this.projects = projectes;
    });
    this.issueService.loadedWorkspace$.subscribe(value => {
      this.isworkspace = value.valueOf();
    });
    this.issueService.globalSettings$.subscribe(settings => {
      settings.forEach(s => {
        if (s.cle === 'logo' && s.active) {
          this.logoUrl =  environment.apiURL+'photo/'+s.settingsValue
        }
      })
    })
  }

  logout() {
    this.authService.logout().subscribe(
      res => {
        this.router.navigate(["/login"]);
      }, error => {
        this.router.navigate(["/login"]);
      }
    );
  }

  myProfile() {
    const dialogRef = this.modalService.open(ProfileComponent, {windowClass: "xlModal"});
    dialogRef.componentInstance.loadUser(this.profile.id);
    dialogRef.componentInstance.action = "Edition d'un utilisateur";
    dialogRef.componentInstance.loadGroupeMember();
    dialogRef.result.then((result) => {
    })
  }

  selectProject(project: Project) {
    this.workspace = project.prefix.toString();
    this.project = project;
    this.router.navigate(["/working/" + project.prefix + "/list"])
  }

  getState(o: any) {
    return this.workspace;
  }

  isworkspace: boolean = false;
  buttonText: string = "workspace";

  triggerAnimation() {
    this.issueService.nextIsLoadingWorkspace(!this.isworkspace);
    if (this.isworkspace)
      this.buttonText = "Shrink";
    else
      this.buttonText = "workspace";
  }

  getLogoUrl() {
    if (this.tempLogo)
      return this.tempLogo;
    return 'media/logo.png';
  }

  selectLogo($event: Event) {
    const input = event.target as HTMLInputElement;
    console.debug("drop ici ");
    if (input.files) {
      const file: File = input.files[0];
      if (file) {
        this.selectedLogo = file;
        this.previewImage(file);
      }
    }
  }

  previewImage(file: File): void {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.tempLogo = reader.result;
      this.logoUrl = reader.result;
    };
  }

  saveLogo() {
    this.issueService.uploadLogo(this.selectedLogo).subscribe( res => {
      this.issueService.loadSettings();
      this.tempLogo = null;
    });
  }
}
