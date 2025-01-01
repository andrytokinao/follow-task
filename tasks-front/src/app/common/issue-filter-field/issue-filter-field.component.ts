import {AfterViewInit, Component} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {stripTypename} from "@apollo/client/utilities";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Status, User, WorkFlow} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {IssueSearchCriteriaInput} from "../../type/issue-search-criteria.util";
import {UserService} from "../../services/user.service";
import {id} from "@swimlane/ngx-charts";

@Component({
  selector: 'app-issue-filter-field',
  templateUrl: './issue-filter-field.component.html',
  styleUrl: './issue-filter-field.component.css'
})
export class IssueFilterFieldComponent implements AfterViewInit{
  searchForm: FormGroup;
  issueCriteria:IssueSearchCriteriaInput = {} ;
  status:Status[] = [];
  statusIds:number[] = [];
  protected users: User[]=[];
  selectedAssign:string[] = [];
  creationFrom: string;
  creationTo: string ;

  constructor(
    public activeModal: NgbActiveModal,
    private issueService:IssueService,
    private userService: UserService,
  ) {

  }


  ngOnInit(): void {

  }

  private loadAllStatus() {
    this.issueService.findAllStatus().subscribe(status => {
      this.status = status;
      console.debug(status);
    } )
  }

  onSubmit(): void {
    // TODO : Save filter
    this.activeModal.close( {criteria: this.searchForm.value});
  }

  selectStatus(id: number) {
    return this.statusIds.some(selected => selected=== id);
  }

  isSelectedStatus(id: number) {
    return this.statusIds.some(selected => selected=== id);
  }

  changeStatuesSelected(event: any, id:number) {
    if (event.checked) {
      this.statusIds.push(id);
    } else {
      this.statusIds = this.statusIds.filter(item => item !== id);
    }
  }

  save() {
    if (this.statusIds && this.statusIds.length != 0) {
      this.issueCriteria.statusIds = this.statusIds;
    }
    if (this.selectedAssign && this.selectedAssign.length !=0){
      this.issueCriteria.assigneUsernames = this.selectedAssign;
    }
    if (this.creationFrom) {
      this.issueCriteria.dateFrom = this.creationFrom;
    }
    if (this.creationTo) {
      this.issueCriteria.dateTo = this.creationTo;
    }
    this.activeModal.close( {criteria: this.issueCriteria});

  }

  isSelectedUser(id: String) {
    return  this.selectedAssign.some(userId => userId === id)
  }

  changeUsersSelected(event: any, id: string) {
    if (event.checked) {
      this.selectedAssign.push(id);
    } else {
      this.selectedAssign = this.selectedAssign.filter(u => u != id);
    }
  }

  ngAfterViewInit(): void {
    this.loadAllStatus();
    this.userService.users$.subscribe((users: any) => {this.users = users});
    if (this.issueCriteria.statusIds){
      this.statusIds = this.issueCriteria.statusIds;
    }
    if (this.issueCriteria.assigneUsernames) {
      this.selectedAssign = this.issueCriteria.assigneUsernames;
    }
  }
}
