import {Component, ElementRef, EventEmitter, HostListener, Output, ViewChild} from '@angular/core';
import {Icone} from "../../type/issue";

@Component({
  selector: 'app-icone-field',
  templateUrl: './icone-field.component.html',
  styleUrl: './icone-field.component.css'
})
export class IconeFieldComponent {
  constructor() {
  }
  @Output() iconSelected = new EventEmitter<any>();
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
    {"typeIcone":"class", "value": "fa fa-id-badge", "id": "\uf2c1"}
  ];
  show: boolean = false;
  selectedIcon:any = {
     id: "0",
     value:"fa fa-edit",
    typeIcone:"class"
  };
  selectIcon(icon: any) {
    console.log("Selected icon:", icon);
    this.selectedIcon = icon;
    this.iconSelected.emit(icon);
    this.show = false;
  }
  @HostListener('window:scroll', ['$event'])
  toggleDropdownPosition(event:Event) {
    this.show = ! this.show;
  }
  @ViewChild('dropdownContent') dropdownContent: ElementRef | undefined;

  getHeight() {
    if (this.dropdownContent) {
     return this.dropdownContent.nativeElement.offsetHeight;
    }
    return 0;
  }
}
