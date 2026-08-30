import {Component, OnInit} from '@angular/core';
import {Project} from "../../../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../services/config.service";
import {IssueService} from "../../../../services/issue.service";
import {ProjectNameComponent} from "./project-name/project-name.component";
import {IssueTypeComponent} from "./issue-type/issue-type.component";
import {ProjectGuard} from "../../../../services/ProjectGuard";

export interface ConfigMenu {
  label: string;
  description: string;
  icon: string;
  route: string;
  credential: string;
  visible: boolean;
}

@Component({
  selector: 'app-create-project',
  standalone: false,
  templateUrl: './config-project.component.html',
  styleUrl: './config-project.component.css'
})
export class ConfigProjectComponent implements OnInit{
  project:Project | any = {};
  collapsed: boolean = false;
  dialogMap: { [regex: string]: any } = {
    'working/admin/working/create$': ProjectNameComponent,
    'working/admin/project/issue-type': IssueTypeComponent,
  };
  menus: ConfigMenu[] = [
    {
      label: 'Type de tâche',
      description: 'Types et sous-types',
      icon: 'fas fa-list-ul',
      route: 'issue-type',
      credential: 'CAN_CONFIG_ISSUE_TYPE',
      visible: false
    },
    {
      label: 'Flux de travail',
      description: 'Statuts et transitions',
      icon: 'fas fa-diagram-project',
      route: 'work-flow',
      credential: 'CAN_CONFIG_WORKFLOW',
      visible: false
    },
    {
      label: 'Champ personnalisé',
      description: 'Champs additionnels',
      icon: 'fas fa-edit',
      route: 'custom-field',
      credential: 'CAN_CONFIG_CUSTOM_FIELD',
      visible: false
    },
    {
      label: 'Stockage',
      description: 'Répertoires et fichiers',
      icon: 'fas fa-hard-drive',
      route: 'storage',
      credential: 'CAN_CONFIG_STORAGE',
      visible: false
    },
    {
      label: 'Équipe',
      description: 'Membres et rôles',
      icon: 'fas fa-people-group',
      route: 'accessibility',
      credential: 'CAN_EDIT_ROLE_USER',
      visible: false
    }
  ];

  constructor(private router: Router,
              private modalService: NgbModal,
              private configService:ConfigService,
              private issueService:IssueService,
              private route: ActivatedRoute,
              protected projectGuard: ProjectGuard
  ) {

  }
  configWorkFlow(){
    const dialogRef = this.modalService.open(IssueTypeComponent,{windowClass: "xlModal"});
    dialogRef.componentInstance.project = this.project;
  }

  get visibleMenus(): ConfigMenu[] {
    return this.menus.filter(menu => menu.visible);
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.project = data['project'];
    });
    // hasCredential renvoie un Observable : la permission est resolue une seule
    // fois ici plutot qu'a chaque cycle de detection de changement.
    this.menus.forEach(menu => {
      this.projectGuard.hasCredential([menu.credential])
        .subscribe(allowed => menu.visible = allowed);
    });
  }
}
