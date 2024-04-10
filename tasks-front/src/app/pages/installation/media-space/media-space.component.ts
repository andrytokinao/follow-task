import { Component } from '@angular/core';
import {ConfigEntry, Issue, Repertoire, User} from "../../../type/issue";
import {HttpClient} from "@angular/common/http";
import {ConfigService} from "../../../services/config.service";

@Component({
  selector: 'app-media-space',
  templateUrl: './media-space.component.html',
  styleUrl: './media-space.component.css'
})
export class MediaSpaceComponent {
  constructor(private http:HttpClient,private configService:ConfigService) {
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
    this.configService.saveConfig('MEDIA_DIRECTORIES',this.pathSelected).subscribe(
      (res:any)=>{
        alert(JSON.stringify(res));
      }, (error :any)=>{
        alert("error "+JSON.stringify(error));
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
        alert(JSON.stringify(err));
      }
    )
  }
}
