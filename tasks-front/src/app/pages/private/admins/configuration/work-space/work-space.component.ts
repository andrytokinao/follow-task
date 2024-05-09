import { Component } from '@angular/core';
import {ConfigEntry, Issue, Project, Repertoire, User} from "../../../../../type/issue";
import {HttpClient} from "@angular/common/http";
import {ConfigService} from "../../../../../services/config.service";

@Component({
  selector: 'app-work-space',
  templateUrl: './work-space.component.html',
  styleUrl: './work-space.component.css'
})
export class WorkSpaceComponent {
  constructor(private http:HttpClient,private configService:ConfigService) {
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
    this.configService.saveConfig('WORK_DIRECTORIES',this.pathSelected,this.configEntry.id).subscribe(
      (res:any)=>{
        console.log(JSON.stringify(res));
      }, (error :any)=>{
        console.error("error "+JSON.stringify(error));
      }
    );
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
    this.http.get<Repertoire[]>("http://localhost:8081/api/sous-dossier/root",{withCredentials:true}).subscribe(
      res => {
        this.repertoire.repertoires = res;
      },
      err => {
        console.error(JSON.stringify(err));
      }
    )
  }
}
