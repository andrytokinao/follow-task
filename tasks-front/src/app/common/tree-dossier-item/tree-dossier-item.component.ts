import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Repertoire} from "../../type/issue";
import {CommonModule} from "@angular/common";
import {HttpClient} from "@angular/common/http";
import {ssenvironment} from "../../../environments/ssenvironment";

@Component({
  selector: 'app-dossier-node-item',
  templateUrl: './tree-dossier-item.component.html',
  styleUrls: ['./tree-dossier-item.component.css']
})
export class TreeDossierItemComponent {
  @Input() repertoire : Repertoire = new class implements Repertoire {
    repertoires: Repertoire[]=[];
    fileName: String='';
    path: String='';
    absolutePath:string ='';
    type: String='';
    icone:String ='';
    isLoaded:boolean = false;
    selected :boolean = false;
    open :boolean = false;
  } ;
  @Input()  lastSelectedPath :string ='';
  @Output() fileSelected: EventEmitter<any> = new EventEmitter<any>();
  private isLoaded: boolean = false ;
  private repertoireUrl = ssenvironment.apiURL+"/api/sous-dossier?path=";
  constructor(private http: HttpClient) { }
  onFileSelected($event: any) {
    this.fileSelected.emit($event);
  }
  isLastSelected():boolean {
    return this.repertoire.absolutePath === this.lastSelectedPath;
  }
  onClick() {
    this.repertoire.selected = !this.repertoire.selected;
    this.fileSelected.emit(this.repertoire);
  }

  openDossier(){
    this.repertoire.open = !this.repertoire.open;
    if (!this.isLoaded) {
       this.http.get<Repertoire[]> (this.repertoireUrl+this.repertoire.absolutePath , {withCredentials:true}).subscribe(
         res => {
           this.repertoire.repertoires = res;
           this.isLoaded = true;
         },
          err=> {
           console.error(err);
          }
       )
    }
  }
}
