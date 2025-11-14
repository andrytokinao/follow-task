import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Repertoire} from "../../type/issue";

@Component({
  selector: 'app-tree-node-item',
  standalone: false,
  templateUrl: './tree-node-item.component.html',
  styleUrls: ['./tree-node-item.component.css']
})
export class TreeNodeItemComponent {
  @Input() repertoire : Repertoire ;
  @Output() fileSelected: EventEmitter<any> = new EventEmitter<any>();
  constructor() { }

  onFileSelected($event: any) {
    this.fileSelected.emit($event);
  }

  onClick() {
    if (this.repertoire.type === 'directory') {
      this.repertoire.open = !this.repertoire.open;
    } else if (this.repertoire.type === 'file') {
      this.repertoire.selected = !this.repertoire.selected;
      this.fileSelected.emit(this.repertoire);
    }

  }
}
