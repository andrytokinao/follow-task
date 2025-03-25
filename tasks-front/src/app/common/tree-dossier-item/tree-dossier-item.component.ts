import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Repertoire} from "../../type/issue";
import {CommonModule} from "@angular/common";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Observable} from "rxjs";
import {subscribe} from "graphql/execution";

@Component({
  standalone: false,
  selector: 'app-dossier-node-item',
  templateUrl: './tree-dossier-item.component.html',
  styleUrls: ['./tree-dossier-item.component.css']
})
export class TreeDossierItemComponent implements OnInit{
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
    paths:string[] =[]
  } ;
  @Input()  lastSelectedPath :string ='';
  @Input()  paths :string [];
  @Input()
  set setRepertoire(repertoire:Repertoire){
    this.repertoire = repertoire;
    this.openPath(repertoire.paths);
  }

  @Output() fileSelected: EventEmitter<any> = new EventEmitter<any>();
  private isLoaded: boolean = false ;
  private repertoireUrl = environment.apiURL+"api/sous-dossier?path=";
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

  openDossier() {
    this.openDossierByPath(this.repertoire.absolutePath);
  }
  openDossierByPath(absolutePath:string){
    this.repertoire.open = !this.repertoire.open;
    if (!this.isLoaded) {
      this.http.get<Repertoire[]> (this.repertoireUrl+absolutePath , {withCredentials:true}).subscribe(

        res => {
          this.repertoire.repertoires =[];
          for( let i in res){
            res[i].paths = this.repertoire.paths;
          }
          console.log(res);
          this.repertoire.repertoires = res;
          this.isLoaded = true;
        },
        err=> {
          console.error(err);
        }
      )
    }
  }
  public static getPaths(httpClient: HttpClient,path:string){
    return new Observable<string[]>(observer => {
      httpClient.get<string[]> (environment.apiURL+"api/paths?path="+path , {withCredentials:true}).subscribe(
        res => {
          observer.next(res);
        },
        err=> {
          console.error(err);
        }
      );
    });
  }
  openPath(paths:string[]){
    for (let i in paths) {
      if (paths[i] == this.repertoire.absolutePath) {
        this.openDossierByPath(this.repertoire.absolutePath);
      }
    }
  }

  ngOnInit(): void {

  }

}
