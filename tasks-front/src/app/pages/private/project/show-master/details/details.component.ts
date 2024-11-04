import {Component, OnInit} from '@angular/core';
import {CustomField, CustomFieldValue, Issue, IssueType, UsingCustomField} from "../../../../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {NewIssueComponent} from "../../modal/new-issue/new-issue.component";
import {CustomFieldComponent} from "../../../../../common/custom-field/custom-field.component";

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrl: './details.component.css'
})
export class DetailsComponent implements OnInit{
  private project: any;
  private profile: any;
  private issue: Issue;
  protected parentIssue: any;
  protected issueType:IssueType | undefined;
  customFieldValue:CustomFieldValue |any= {}
  customFieldValues :CustomFieldValue[] = [];
  newValues:CustomFieldValue[] =[];
  usingCustomFields :UsingCustomField[] = [];
  values : CustomFieldValue[]=[];
  currentCustomFieldValue:any = null ;
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService:ConfigService,
              private issueService:IssueService,
              private userService:UserService,
              private route: ActivatedRoute,
              private authService: AuthService
  ) {
  }
  subtasks: Issue[];
  newSubtask: Issue;
  userngCustomFields: UsingCustomField[] = [];


  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.parentIssue = data['parrentIssue'];
      this.project = data['project'];
      this.loadValues();
    });
    this.authService.getProfile().subscribe((res)=>{
      this.profile = res;
    });

  }


  loadValues(){
    console.info("--- Loading  values ---")
    this.issueService.getValues(this.parentIssue.id).subscribe(res => {
      this.customFieldValues = res;
      this.loadIssueType();
      }
    );
  }
  loadIssueType(){
    this.issueService.getIssueTypeById(this.parentIssue.issueType.id).subscribe(issueType => {
      this.issueType = issueType;
      for( let usingCf of this.issueType.usingCustomFields){
        this.values.push(this.getCustomFieldValue(usingCf.customField));
      }
    })
  }

  protected readonly CustomFieldComponent = CustomFieldComponent;

  saveCustomFieldValue(event: CustomFieldValue) {
    this.issueService.saveValues(event).subscribe(value =>
      (values:CustomFieldValue[]) => {
        this.customFieldValues = values;
      }
    );
  }
  addCustomFieldValue(usingCustomField:UsingCustomField) {
    this.currentCustomFieldValue = {};
    let issue:any = {};
    issue.id = this.issue.id;
    this.currentCustomFieldValue.customField = usingCustomField.customField;
    this.currentCustomFieldValue.issue = issue;
  }
  getCustomFieldValue(customField:CustomField) {
  let value: CustomFieldValue;


   value = this.customFieldValues.find(
      cfv=> cfv.customField.id == customField.id
    );

    if(value != null ) {
     return value;
   }
    return CustomFieldComponent.newValue(this.parentIssue,customField);

  }

}
