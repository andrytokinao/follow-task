import {Component, OnInit} from '@angular/core';
import {CustomField, DisplayCustomField, IssueType, Project, UsingCustomField} from "../../../../../type/issue";
import {IssueTypeComponent} from "../issue-type/issue-type.component";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {EditCustomFieldComponent} from "./edit-custom-field/edit-custom-field.component";
import {CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem} from "@angular/cdk/drag-drop";
import {MyCommonModule} from "../../../../../common/common.module";
import {NgForOf, NgIf} from "@angular/common";
import {supprimerTypename} from "../../../../../type/graphql.operations";

@Component({
  selector: 'app-custom-field',
  templateUrl: './custom-field.component.html',
  styleUrl: './custom-field.component.css',
  standalone: true,
  imports: [CdkDropList, CdkDrag, MyCommonModule, NgForOf, NgIf],
})
export class CustomFieldComponent implements OnInit{
  activeModal: any;
  project: Project | any ={};
  customFields :CustomField[] =[];
  todo = ['Get to work', 'Pick up groceries', 'Go home', 'Fall asleep'];

  done = ['Get up', 'Brush teeth', 'Take a shower', 'Check e-mail', 'Walk dog'];
  private dragedItem: string | undefined;
  customFieldsSelected: UsingCustomField[] = [];
  issueType: IssueType | undefined;
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService:ConfigService,
              private issueService:IssueService,
              private route: ActivatedRoute
  ) {

  }
  newCustomField(){
    const dialogRef = this.modalService.open(EditCustomFieldComponent);
    dialogRef.componentInstance.project = this.project;
    dialogRef.result.then((result) => {
      this.customFields = result.customFields;
    })
  }
  saveCustomField(customField:CustomField) {
    this.issueService.saveCustomField(customField).subscribe(customFields=> {
      this.customFields = customFields;
    })
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.project = data['project'];
    });
    this.issueService.allCustomField().subscribe(customFields=>{
      this.customFields = customFields;

    })
  }
  selectIssueType(issueType: any) {
    this.issueType = issueType;
    this.customFieldsSelected = this.issueType.usingCustomFields;
    this.issueService.customFieldsByIssueType(this.issueType.id).subscribe(result => {
      this.issueType.usingCustomFields = result;
      this.customFieldsSelected = this.issueType.usingCustomFields;
    })
  }
  isSelectedIssueType(issueType: any) {
    if (issueType == null || issueType.id == null || issueType.id == undefined) {
      return false;
    }
    if (this.issueType == null || this.issueType.id == null ||  this.issueType == undefined || this.issueType.id == undefined ) {
      return false;
    }
    return this.issueType.id == issueType.id;
  }


  saveIssueType($event: IssueType) {

  }
  use(event: CdkDragDrop<UsingCustomField[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {

      const cf:any = event.previousContainer.data[event.previousIndex];
      const usingCustomField : UsingCustomField | any = {};
      const issueType : IssueType | any = {};
      const customField: CustomField | any = {};

      customField.id = cf.id;
      customField.name = cf.name;

      issueType.id = this.issueType.id
      usingCustomField.customField = customField;
      usingCustomField.issueType = issueType;
      this.issueService.useCustomField(usingCustomField).subscribe((result)=> {
        this.issueType.usingCustomFields = result;
        this.customFieldsSelected = this.issueType.usingCustomFields;
      })
    }
  }
  unUse(event: CdkDragDrop<CustomField[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {

      const cf :any= event.previousContainer.data[event.previousIndex];

      this.issueService.unUseCustomField(supprimerTypename(cf)).subscribe((result)=> {
        this.issueType.usingCustomFields = result;
        this.issueType.name = " Hahaha";
        this.customFieldsSelected = this.issueType.usingCustomFields;
      })
    }
  }
  dropSelect($event: CdkDragDrop<CustomField[], any>) {

  }
}
