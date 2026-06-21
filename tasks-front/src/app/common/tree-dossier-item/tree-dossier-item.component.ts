// ─── dossier-node-item.component.ts ──────────────────────────────────────────

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {FileTypeInfo, getFileTypeInfo, Repertoire} from "../../type/issue";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Observable} from "rxjs";

@Component({
  standalone: false,
  selector: 'app-dossier-node-item',
  templateUrl: './tree-dossier-item.component.html',
  styleUrls: ['./tree-dossier-item.component.css']
})
export class TreeDossierItemComponent implements OnInit, OnChanges {

  _repertoire!: Repertoire;
  @Input() lastSelectedPath: string = '';
  @Input() selectedPaths: Set<string> = new Set();

  @Output() fileSelected   = new EventEmitter<Repertoire>();
  @Output() selectionToggled = new EventEmitter<Repertoire>();

  typeInfo!: FileTypeInfo;
  paths :string [];
  private isLoaded: Boolean = false;
  private repertoireUrl = environment.apiURL+"api/repertoires?path=";
  constructor(private http:HttpClient) {
  }
  @Input()
  set repertoire(repertoire:Repertoire){
    this._repertoire = repertoire;
    this.openDossierByPath(repertoire.absolutePath);
  }

  ngOnInit(): void {
    this.typeInfo   = getFileTypeInfo(this._repertoire);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['setRepertoire']) {
      this.typeInfo   = getFileTypeInfo(this._repertoire);
    }
  }

  /** Ouvre / ferme le dossier */
  toggleOpen(event: MouseEvent): void {
    event.stopPropagation();
    if (this._repertoire.type === 'folder') {
      this._repertoire.open = !this._repertoire.open;
    }
  }

  /** Clic sur le nom → sélection simple */
  onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.fileSelected.emit(this._repertoire);
  }

  /** Clic sur la case à cocher → sélection multiple */
  onCheckboxClick(event: MouseEvent): void {
    event.stopPropagation();
    this.selectionToggled.emit(this._repertoire);
  }

  isSelected(): boolean {
    return this.selectedPaths.has(this._repertoire.absolutePath);
  }

  isLastSelected(): boolean {
    return this.lastSelectedPath === this._repertoire.absolutePath;
  }

  /** Propage les événements des enfants */
  onFileSelected(rep: Repertoire): void {
    this.fileSelected.emit(rep);
  }

  onSelectionToggled(rep: Repertoire): void {
    this.selectionToggled.emit(rep);
  }
  openDossier() {
    this.openDossierByPath(this._repertoire.absolutePath);
  }
  openDossierByPath(absolutePath:string){
    this._repertoire.open = !this._repertoire.open;
    if (!this.isLoaded) {
      this.http.get<Repertoire[]> (this.repertoireUrl+absolutePath , {withCredentials:true}).subscribe(

        res => {
          this._repertoire.repertoires =[];
          for( let i in res){
            res[i].paths = this._repertoire.paths;
          }
          console.log(res);
          this._repertoire.repertoires = res;
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
      if (paths[i] == this._repertoire.absolutePath) {
        this.openDossierByPath(this._repertoire.absolutePath);
      }
    }
  }



}
