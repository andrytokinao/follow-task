import {Component, Input} from '@angular/core';
import {Comment, CustomField, CustomFieldValue, Issue, IssueType, UsingCustomField} from "../../../../../type/issue";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {CustomFieldComponent} from "../../../../../common/custom-field/custom-field.component";

@Component({
  selector: 'app-issue-details',
  templateUrl: './issue-details.component.html',
  styleUrl: './issue-details.component.css'
})
export class IssueDetailsComponent {
  private project: any;
  private issue: Issue;
  protected parentIssue: any;
  protected issueType:IssueType | undefined;
  expaces:any[]=[];
  customFieldValue:CustomFieldValue |any= {}
  customFieldValues :CustomFieldValue[] = [];
  newValues:CustomFieldValue[] =[];
  usingCustomFields :UsingCustomField[] = [];
  values : CustomFieldValue[]=[];
  currentCustomFieldValue:any = null ;
  viewModeField: string='info-edit';
  activeMenuItem: string;
  profile:any  = {};

  comment:any = {
    issue:{},
    user:{}
  };
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService:ConfigService,
              private issueService:IssueService,
              protected userService:UserService,
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
      this.loadComments();
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

  setViewMode(s: string) {
    this.viewModeField = s;
  }

  comments :Comment[] = [];

  addComment() {
    this.comment.user.id = this.profile.id;// TODO: Change to user connected recuperer coté serveur
    this.comment.issue.id = this.parentIssue.id;

    this.issueService.addComment(this.comment).subscribe(res=>{
      this.comments = res;
      this.comment.text ="";
    });
  }
  loadComments(){
    console.info("--- Loading  comment ---")
    this.issueService.allComment(this.parentIssue.id).subscribe(comments =>{
        this.comments = comments;
      }
    );
  }

}
