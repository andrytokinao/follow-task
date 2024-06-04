import {Component, OnInit} from '@angular/core';
import {CustomField, IssueType, Project} from "../../../../../type/issue";
import {IssueTypeComponent} from "../issue-type/issue-type.component";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {EditCustomFieldComponent} from "./edit-custom-field/edit-custom-field.component";

@Component({
  selector: 'app-custom-field',
  templateUrl: './custom-field.component.html',
  styleUrl: './custom-field.component.css'
})
export class CustomFieldComponent implements OnInit{
  activeModal: any;
  project: Project | any ={};
  customFields :CustomField[] =[];
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

  isSelectedIssueType(itype: any) {
    return false;
  }

  selectIssueType(itype: any) {

  }

  saveIssueType($event: IssueType) {

  }
}
