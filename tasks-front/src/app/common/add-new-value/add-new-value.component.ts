import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {CustomFieldValue, Issue, UsingCustomField} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {NgForOf, NgIf} from "@angular/common";
import {CustomFieldComponent} from "../custom-field/custom-field.component";
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";

@Component({
  selector: 'add-new-value',
  imports: [
    NgForOf,
    NgIf,
    CustomFieldComponent,
    MatMenu,
    MatMenuTrigger
  ],
  templateUrl: './add-new-value.component.html',
  styleUrl: './add-new-value.component.css'
})
export class AddNewValueComponent implements OnInit,AfterViewInit{
    @Input() issue:Issue;
  usingCustomFields :UsingCustomField[] = [];
  currentValue: CustomFieldValue | null;

  constructor(private issueService:IssueService) {
    }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.customFieldsByIssueType();
  }
  customFieldsByIssueType(){
    this.issueService.customFieldsByIssueType(this.issue.issueType.id).subscribe(
      {
        next:(usingCustomFields)=> {
          this.usingCustomFields =usingCustomFields;
        }
      }
    );
  }

  addCustomFieldValue(usingCustomField: UsingCustomField) {
    this.currentValue = {issue:this.issue,customField:usingCustomField.customField};

  }
}
