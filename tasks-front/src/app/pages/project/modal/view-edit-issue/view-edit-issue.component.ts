import {Component, Inject, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Issue, Status, Comment, CustomFieldValue, CustomField, User} from "../../../../type/issue";
import {IssueService} from "../../../../services/issue.service";
import {UserService} from "../../../../services/user.service";
import {supprimerTypename} from "../../../../type/graphql.operations";
import {stripTypename} from "@apollo/client/utilities";
@Component({
  selector: 'app-view-edit-issue',
  templateUrl: './view-edit-issue.component.html',
  styleUrl: './view-edit-issue.component.css'
})
export class ViewEditIssueComponent {
  type: string = 'type1';
  comment:any = {
    issue:{},
    user:{}
  };
  comments :Comment[] = [];
  customFieldValues :CustomFieldValue[] = [];
  customFields :CustomField[] = [];
  editingDescription: boolean = false;
  activeMenuItem: string="comment";
  newComment: string = '';
  issue: Issue = new Issue();
  curentCustomField?: CustomField;
  currentCustomFieldValue:any = null ;
  users: User[] = [];
  string: String = "tay be ";


  constructor(
    public activeModal: NgbActiveModal,
    public issueService:IssueService,
    public userService:UserService
  ) {}
  editDescription(){
    this.editingDescription =!this.editingDescription;
  }
  save() {
    this.issueService.saveIssue(this.issue).subscribe((res:any)=>{
      this.activeModal.close({ issue: res.data.saveIssue });
    });
  }
  toggleMenu(menu:string) {
    this.activeMenuItem = menu;
  }

  addComment() {
    this.comment.user.id = this.issue.assigne.id;// TODO: Change to user connected
    this.comment.issue.id = this.issue.id;

    this.issueService.addComment(this.comment).subscribe(
      {
        next:(result:any)=>{
          console.info("--- Loadin adding comment ---> "+JSON.stringify(result));
          this.comments = result.data.addComment as Comment[];
          this.comment.text="";
        },
          error:(err)=>{
        alert(JSON.stringify(err));
      }
    });
  }
  loadComments(){
    console.info("--- Loading  comment ---")
    this.issueService.allComment(this.issue.id).subscribe(
      {
        next:(res:any)=>{
          this.comments =res.data.allComment as Comment[];
          console.info("--- Loadin comment ---> "+JSON.stringify(this.comments));
        },
        error:(err:any)=>{
          alert(JSON.stringify(err))
        }
      }
    );
  }
  loadValues(){
    console.info("--- Loading  values ---")
    this.issueService.getValues(this.issue.id).subscribe(
      {
        next:(res:any)=>{
          this.customFieldValues =res.data.getValues as CustomFieldValue[];
          console.info("--- Loadin customField values ---> "+JSON.stringify(this.customFieldValues));
        },
        error:(err:any)=>{
          alert(JSON.stringify(err))
        }
      }
    );
  }
  allCustomField(){
    console.info("--- Loading all customFields ---")
    this.issueService.allCustomField(this.issue.id).subscribe(
      {
        next:(res:any)=>{
          this.customFields =res.data.allCustomField as CustomField[];
          console.info("--- Loadin all customFields resule =  "+JSON.stringify(this.customFields));
        },
        error:(err:any)=>{
          alert(JSON.stringify(err))
        }
      }
    );
  }
  addCustomFieldValue(customField:CustomField) {
    this.currentCustomFieldValue = {};
    this.currentCustomFieldValue.customField = customField;
  }
  saveValue() {
    this.currentCustomFieldValue.issue = this.issue;
    let value = supprimerTypename(this.currentCustomFieldValue);
    this.issueService.saveValues(value).subscribe({
      next:((res:any)=>{
        alert('Saving saccessful  ');
        this.customFieldValues= stripTypename(res.data.saveValue);
      }),
      error:(err=>{
        console.error(' error  '+JSON.stringify(err))
      })
      }
    )
    this.currentCustomFieldValue = null;
  }

  valueIsValid() :boolean{
    if(this.currentCustomFieldValue == null)
      return false;
    return this.currentCustomFieldValue.text!=null ||
      this.currentCustomFieldValue.numeric !=null ||
      this.currentCustomFieldValue.string !=null ||
      this.currentCustomFieldValue.date !=null ||
      this.currentCustomFieldValue.user !=null;
  }
}
