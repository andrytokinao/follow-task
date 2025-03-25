import {Component, ElementRef, EventEmitter, HostListener, Output, ViewChild} from '@angular/core';
import {Icone, Issue} from "../../type/issue";
import {ViewEditIssueComponent} from "../../pages/private//project/modal/view-edit-issue/view-edit-issue.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ChooseDialogComponent} from "./choose-dialog/choose-dialog.component";

@Component({
  standalone: false,
  selector: 'app-icone-field',
  templateUrl: './icone-field.component.html',
  styleUrl: './icone-field.component.css'
})
export class IconeFieldComponent {
  constructor(
    private modalService: NgbModal,
  ) {
  }
  @Output() iconSelected = new EventEmitter<any>();

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
    this.openDialog();
  }
  openDialog() {
      const dialogRef = this.modalService.open(ChooseDialogComponent, );
      dialogRef.result.then((res) => {
        this.selectedIcon = res.icone;
        this.iconSelected.emit(res.icone);
        this.show = false;
      })

  }
  @ViewChild('dropdownContent') dropdownContent: ElementRef | undefined;

  getHeight() {
    if (this.dropdownContent) {
     return this.dropdownContent.nativeElement.offsetHeight;
    }
    return 0;
  }
}
