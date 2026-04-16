import {Component, EventEmitter, Output} from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";
import {Icone} from "../../../type/issue";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-choose-dialog',
  standalone: true,
    imports: [
        NgForOf,
    ],
  templateUrl: './choose-dialog.component.html',
  styleUrl: './choose-dialog.component.css'
})
export class ChooseDialogComponent {
  @Output() iconSelected:EventEmitter<Icone> = new EventEmitter<Icone>();
  constructor(
    public activeModal: NgbActiveModal,
    ) {}
  icons = [
    {"typeIcone":"class", "value": "fa fa-tasks", "id": "\uf0ae"},
    {"typeIcone":"class", "value": "fa fa-check-circle", "id": "\uf058"},
    {"typeIcone":"class", "value": "fa fa-calendar-alt", "id": "\uf073"},
    {"typeIcone":"class", "value": "fa fa-list-ul", "id": "\uf0ca"},
    {"typeIcone":"class", "value": "fa fa-clock", "id": "\uf017"},
    {"typeIcone":"class", "value": "fa fa-cogs", "id": "\uf085"},
    {"typeIcone":"class", "value": "fa fa-chart-line", "id": "\uf201"},
    {"typeIcone":"class", "value": "fa fa-file-alt", "id": "\uf15c"},
    {"typeIcone":"class", "value": "fa fa-comment-dots", "id": "\uf4ad"},
    {"typeIcone":"class", "value": "fa fa-briefcase", "id": "\uf0b1"},
    {"typeIcone":"class", "value": "fa fa-users", "id": "\uf0c0"},
    {"typeIcone":"class", "value": "fa fa-map-marker", "id": "\uf041"},
    {"typeIcone":"class", "value": "fa fa-envelope", "id": "\uf0e0"},
    {"typeIcone":"class", "value": "fa fa-hourglass-half", "id": "\uf252"},
    {"typeIcone":"class", "value": "fa fa-book", "id": "\uf02d"},
    {"typeIcone":"class", "value": "fa fa-paper-plane", "id": "\uf1d8"},
    {"typeIcone":"class", "value": "fa fa-clipboard-list", "id": "\uf46d"},
    {"typeIcone":"class", "value": "fa fa-chart-bar", "id": "\uf080"},
    {"typeIcone":"class", "value": "fa fa-tachometer-alt", "id": "\uf3fd"},
    {"typeIcone":"class", "value": "fa fa-file-signature", "id": "\uf573"},
    {"typeIcone":"class", "value": "fa fa-comment-alt", "id": "\uf27a"},
    {"typeIcone":"class", "value": "fa fa-bullhorn", "id": "\uf0a1"},
    {"typeIcone":"class", "value": "fa fa-bell", "id": "\uf0f3"},
    {"typeIcone":"class", "value": "fa fa-bug", "id": "\uf188"},
    {"typeIcone":"class", "value": "fa fa-calendar-check", "id": "\uf274"},
    {"typeIcone":"class", "value": "fa fa-thumbtack", "id": "\uf08d"},
    {"typeIcone":"class", "value": "fa fa-globe", "id": "\uf0ac"},
    {"typeIcone":"class", "value": "fa fa-link", "id": "\uf0c1"},
    {"typeIcone":"class", "value": "fa fa-folder-open", "id": "\uf07c"},
    {"typeIcone":"class", "value": "fa fa-exclamation-circle", "id": "\uf06a"},
    {"typeIcone":"class", "value": "fa fa-comment-medical", "id": "\uf7f5"},
    {"typeIcone":"class", "value": "fa fa-trophy", "id": "\uf091"},
    {"typeIcone":"class", "value": "fa fa-truck", "id": "\uf0d1"},
    {"typeIcone":"class", "value": "fa fa-calendar-minus", "id": "\uf272"},
    {"typeIcone":"class", "value": "fa fa-chart-pie", "id": "\uf200"},
    {"typeIcone":"class", "value": "fa fa-info-circle", "id": "\uf05a"},
    {"typeIcone":"class", "value": "fa fa-shield-alt", "id": "\uf3ed"},
    {"typeIcone":"class", "value": "fa fa-bell-slash", "id": "\uf1f6"},
    {"typeIcone":"class", "value": "fa fa-calendar-plus", "id": "\uf271"},
    {"typeIcone":"class", "value": "fa fa-comment-slash", "id": "\uf4b3"},
    {"typeIcone":"class", "value": "fa fa-flag", "id": "\uf024"},
    {"typeIcone":"class", "value": "fa fa-wrench", "id": "\uf0ad"},
    {"typeIcone":"class", "value": "fa fa-paperclip", "id": "\uf0c6"},
    {"typeIcone":"class", "value": "fa fa-clone", "id": "\uf24d"},
    {"typeIcone":"class", "value": "fa fa-ban", "id": "\uf05e"},
    {"typeIcone":"class", "value": "fa fa-file", "id": "\uf15b"},
    {"typeIcone":"class", "value": "fa fa-balance-scale", "id": "\uf24e"},
    {"typeIcone":"class", "value": "fa fa-comment", "id": "\uf075"},
    {"typeIcone":"class", "value": "fa fa-id-badge", "id": "\uf2c1"},
    {"typeIcone":"class", "value": "fa fa-saved", "id": "\uf0c7"},
    {"typeIcone":"class", "value": "fa fa-trash", "id": "\uf1f8"},
    {"typeIcone":"class", "value": "fa fa-undo", "id": "\uf0e2"},
    {"typeIcone":"class", "value": "fa fa-redo", "id": "\uf01e"},
    {"typeIcone":"class", "value": "fa fa-print", "id": "\uf02f"},
    {"typeIcone":"class", "value": "fa fa-download", "id": "\uf019"},
    {"typeIcone":"class", "value": "fa fa-upload", "id": "\uf093"},
    {"typeIcone":"class", "value": "fa fa-search", "id": "\uf002"},
    {"typeIcone":"class", "value": "fa fa-pencil-alt", "id": "\uf303"},
    {"typeIcone":"class", "value": "fa fa-copy", "id": "\uf0c5"},
    {"typeIcone":"class", "value": "fa fa-cut", "id": "\uf0c4"},
    {"typeIcone":"class", "value": "fa fa-paste", "id": "\uf0ea"},
    {"typeIcone":"class", "value": "fa fa-lock", "id": "\uf023"},
    {"typeIcone":"class", "value": "fa fa-unlock", "id": "\uf09c"}
  ];

  sele

  selectIcon(icon:any){
    this.iconSelected.emit(icon);
    this.activeModal.close({ icone: icon });
  }

}
