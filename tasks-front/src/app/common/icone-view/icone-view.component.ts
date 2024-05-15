import {Component, Input} from '@angular/core';
import {Icone} from "../../type/issue";
import {extractClass} from "@angular/compiler-cli/src/ngtsc/docs/src/class_extractor";

@Component({
  selector: 'app-icone-view',
  templateUrl: './icone-view.component.html',
  styleUrl: './icone-view.component.css'
})
export class IconeViewComponent {
  @Input() icon: Icone | any = {};
  @Input() width: string ="";

}
