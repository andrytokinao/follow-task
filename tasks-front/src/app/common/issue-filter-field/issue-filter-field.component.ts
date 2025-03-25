import {AfterViewInit, Component} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Project, Status, User, WorkFlow} from "../../type/issue";
import {IssueService} from "../../services/issue.service";
import {CustomFilter, IssueSearchCriteriaInput} from "../../type/issue-search-criteria.util";
import {UserService} from "../../services/user.service";
import {ProjectGuard} from "../../services/ProjectGuard";

@Component({
  standalone: false,
  selector: 'app-issue-filter-field',
  templateUrl: './issue-filter-field.component.html',
  styleUrl: './issue-filter-field.component.css'
})
export class IssueFilterFieldComponent implements AfterViewInit{
  customFilter:CustomFilter ={};
  project:Project ;
  searchForm: FormGroup;
  issueCriteria:IssueSearchCriteriaInput = {} ;
  status:Status[] = [];
  statusIds:number[] = [];
  protected users: User[]=[];
  selectedAssign:string[] = [];
  creationFrom: string;
  creationTo: string ;
  myfilter: CustomFilter = {};

  constructor(
    public activeModal: NgbActiveModal,
    private issueService:IssueService,
    private userService: UserService,
    protected projectGruard: ProjectGuard
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
    if (!this.customFilter.criteria.statusIds) {
      return false;
    }
    return this.customFilter.criteria.statusIds.some(selected => selected == id);
  }

  changeStatuesSelected(event: any, id:number) {
    if (event.checked) {
      if (!this.customFilter.criteria.statusIds) {
        this.customFilter.criteria.statusIds = [];
      }
      this.customFilter.criteria.statusIds.push(id);
    } else {
      this.customFilter.criteria.statusIds = this.customFilter.criteria.statusIds.filter(item => item != id);
    }
  }

  save() {
    this.customFilter.projectId = this.project?.id;
    this.issueService.saveCustomFilter(this.customFilter).subscribe(customFilter => {
      this.customFilter = customFilter;
      this.issueService.loadMyFilters();
      this.activeModal.close( {criteria: this.issueCriteria});
    })
  }

  isSelectedUser(id: String) {
    if (!this.customFilter.criteria.assigneUsernames)
      return false;
    return  this.customFilter.criteria.assigneUsernames.some(userId => userId === id)
  }

  changeUsersSelected(event: any, id: string) {
    if (event.checked) {
      if (!this.customFilter.criteria.assigneUsernames) {
        this.customFilter.criteria.assigneUsernames = [];
      }
      this.customFilter.criteria.assigneUsernames .push(id);
    } else {
      this.selectedAssign = this.selectedAssign.filter(u => u != id);
    }
  }
  setCustomFilter(customFilter:CustomFilter) {
    this.customFilter = customFilter;
    if (customFilter.criteria ) {
      this. selectedAssign = customFilter.criteria.assigneUsernames? customFilter.criteria.assigneUsernames :[];
      this.statusIds = customFilter.criteria.statusIds? customFilter.criteria.statusIds :[];
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
    this.issueService.project$.subscribe(project => {
      this.project = project;
    });
  }

  cancel() {
    this.issueService.loadMyFilters();
    this.activeModal.dismiss('cancel');

  }
}
