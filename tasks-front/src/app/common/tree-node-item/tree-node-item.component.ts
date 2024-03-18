import { Component, Input } from '@angular/core';
import {Repertoire} from "../../type/issue";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-tree-node-item',
  templateUrl: './tree-node-item.component.html',
  styleUrls: ['./tree-node-item.component.css']
})
export class TreeNodeItemComponent {
  @Input() repertoire : Repertoire = new class implements Repertoire {
    repertoires: Repertoire[]=[];
    fileName: String='';
    path: String='';
    type: String='';
    icone:String =''
  } ;

  constructor() { }
}
