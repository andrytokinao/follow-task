import { Component, Input } from '@angular/core';
import {Node} from "../../type/issue";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-tree-node-item',
  templateUrl: './tree-node-item.component.html',
  styleUrls: ['./tree-node-item.component.css']
})
export class TreeNodeItemComponent {
  @Input() node: Node = new class implements Node {
    children: Node[]=[];
    fileName: String='';
    path: String='';
    type: String='';
  } ;

  constructor() { }
}
