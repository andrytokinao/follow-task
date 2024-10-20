import { Component } from '@angular/core';
import {MyCommonModule} from "../../../../../common/common.module";
import {NgForOf, NgIf} from "@angular/common";
import {HttpClient} from "@angular/common/http";
import {ConfigService} from "../../../../../services/config.service";
import {ConfigEntry, ConfigProject, Repertoire} from "../../../../../type/issue";
import {environment} from "../../../../../../environments/environment";
import {IssueService} from "../../../../../services/issue.service";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-storage',
  standalone: true,
  imports: [
    MyCommonModule,
    NgForOf,
    NgIf
  ],
  templateUrl: './storage.component.html',
  styleUrl: './storage.component.css'
})
export class StorageComponent {
  private project: any;
  private configProjects: ConfigProject[] = [];
  private configPath:ConfigProject ;
  constructor(private http:HttpClient,
              private   configService:ConfigService,
              private issueService:IssueService,
              private router: Router,
              private modalService: NgbModal,
              private route: ActivatedRoute
  ) {
    this.configService.loadConfig().subscribe((conf)=>{
      this.configEntry = conf;
    });
    this.loadDossier();
  }
  repertoire:Repertoire = new class implements Repertoire {
    fileName: String="No directory";
    absolutePath:string = 'no';
    path: String ="no";
    repertoires: Repertoire[] =[];
    type: String = "none";
    selected :boolean = false;
    open : boolean = false;
  };

  configEntry :ConfigEntry | any= {}
  lastSelected:Repertoire | null = null;
  pathSelected:string = '';

  saveConfig() {
    this.issueService.setConfigProjectPath(this.pathSelected,this.project.id);

  }

  onFileSelected(repertoire: any) {
    if (repertoire.selected) {
      this.pathSelected = repertoire.absolutePath;
      this.configEntry.entry =  this.pathSelected;
      this.lastSelected = repertoire
    } else {
      this.pathSelected = '';
      this.lastSelected = null;
      this.configEntry.entry = this.pathSelected;
    }
    console.log('Fichiers sélectionnés :', this.pathSelected);
  }
  loadDossier(){
    this.http.get<Repertoire[]>( environment.apiURL+"api/sous-dossier/root",{withCredentials:true}).subscribe(
      res => {
        this.repertoire.repertoires = res;
      },
      err => {
        console.error(JSON.stringify(err));
      }
    )
  }
  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.project = data['project'];
      this.issueService.getConfigProject(this.project.id).subscribe(res=>{
        this.configProjects = res;
        this.loadConfig();
      })
    });
  }
  loadConfig(){
    this.issueService.getConfigProject(this.project.id).subscribe(res=>{
      this.configProjects = res;
      if( this.configProjects != null ) {
        this.configProjects.forEach(cp=> {
          if (cp.configof == "config.project."+this.project.id+".path") {
            this.configPath = cp;
            this.pathSelected = cp.value;
          }
        })
      }
    })
  }
}
